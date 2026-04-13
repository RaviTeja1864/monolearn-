const STOP_WORDS = new Set([
  'a',
  'about',
  'after',
  'all',
  'also',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'before',
  'being',
  'but',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'for',
  'from',
  'had',
  'has',
  'have',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'kind',
  'like',
  'more',
  'most',
  'not',
  'number',
  'of',
  'one',
  'on',
  'or',
  'our',
  'out',
  'really',
  'so',
  'some',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'thing',
  'things',
  'they',
  'this',
  'to',
  'two',
  'up',
  'use',
  'using',
  'very',
  'was',
  'we',
  'what',
  'when',
  'which',
  'with',
  'would',
  'you',
  'your',
]);

const TITLE_PREFIXES = [
  'Opening Focus',
  'Core Setup',
  'Key Mechanism',
  'Worked Example',
  'Applied Insight',
  'Synthesis',
  'Closing Takeaway',
];

const SUMMARY_HINTS = [
  'summary',
  'summarize',
  'overview',
  'recap',
  'key points',
  'main points',
  'takeaways',
  'what is this video about',
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toTitleCase = (value) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const cleanWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const tokenize = (value) =>
  cleanWhitespace(value)
    .toLowerCase()
    .match(/[a-z0-9']+/g) || [];

const normalizeWord = (value) => value.replace(/^'+|'+$/g, '');

const splitIntoSentences = (value) =>
  cleanWhitespace(value).match(/[^.!?]+(?:[.!?]+|$)/g)?.map(cleanWhitespace).filter(Boolean) || [];

const truncateWords = (value, limit = 40) => {
  const words = cleanWhitespace(value).split(/\s+/).filter(Boolean);

  if (words.length <= limit) {
    return words.join(' ');
  }

  return `${words.slice(0, limit).join(' ')}...`;
};

const buildReadableSnippet = (value, maxSentences = 2, maxWords = 42) => {
  const sentences = splitIntoSentences(value);
  const source = sentences.length > 0 ? sentences.slice(0, maxSentences).join(' ') : value;
  return truncateWords(source, maxWords);
};

const normalizeTranscript = (transcript) =>
  transcript.reduce((items, item) => {
    const text = cleanWhitespace(item.text || '');

    if (!text) {
      return items;
    }

    const normalizedItem = {
      ...item,
      text,
      offset: Number.isFinite(item.offset) ? item.offset : 0,
      duration: Number.isFinite(item.duration) ? item.duration : 0,
    };
    const previousItem = items[items.length - 1];

    if (
      previousItem &&
      previousItem.text === normalizedItem.text &&
      normalizedItem.offset - previousItem.offset <= Math.max(previousItem.duration, 1500)
    ) {
      previousItem.duration = Math.max(previousItem.duration, normalizedItem.duration);
      return items;
    }

    items.push(normalizedItem);
    return items;
  }, []);

const getKeywordFrequency = (texts) => {
  const frequency = new Map();

  texts.forEach((text) => {
    tokenize(text).forEach((token) => {
      const word = normalizeWord(token);

      if (!word || word.length < 3 || STOP_WORDS.has(word)) {
        return;
      }

      frequency.set(word, (frequency.get(word) || 0) + 1);
    });
  });

  return frequency;
};

const getTopKeywords = (texts, limit = 4) =>
  [...getKeywordFrequency(texts).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);

const scoreTextByKeywords = (text, keywordScores) => {
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return 0;
  }

  return tokens.reduce((score, token) => score + (keywordScores.get(token) || 0), 0) / tokens.length;
};

const buildCandidateBlocks = (items) => {
  const blocks = [];

  for (let index = 0; index < items.length; index += 1) {
    for (let size = 2; size <= 4; size += 1) {
      const slice = items.slice(index, index + size);

      if (slice.length === 0) {
        continue;
      }

      const text = cleanWhitespace(slice.map((item) => item.text).join(' '));

      if (text.length < 45) {
        continue;
      }

      blocks.push({
        text,
        startIndex: index,
      });
    }
  }

  return blocks;
};

const shouldCloseTranscriptBlock = ({ text, nextGap, isLastItem }) => {
  if (isLastItem) {
    return true;
  }

  if (nextGap > 6000) {
    return true;
  }

  if (text.length >= 260) {
    return true;
  }

  return text.length >= 120 && /[.!?]["']?$/.test(text);
};

const buildTranscriptBlocks = (transcript) => {
  const blocks = [];
  let currentItems = [];

  const pushCurrentBlock = () => {
    if (currentItems.length === 0) {
      return;
    }

    const startMs = currentItems[0].offset;
    const lastItem = currentItems[currentItems.length - 1];
    const endMs = lastItem.offset + lastItem.duration;
    const text = cleanWhitespace(currentItems.map((item) => item.text).join(' '));

    if (!text) {
      currentItems = [];
      return;
    }

    blocks.push({
      id: `transcript-block-${blocks.length + 1}`,
      startMs,
      endMs,
      startLabel: formatTimestamp(startMs),
      endLabel: formatTimestamp(endMs),
      cueCount: currentItems.length,
      text,
    });
    currentItems = [];
  };

  transcript.forEach((item, index) => {
    currentItems.push(item);

    const nextItem = transcript[index + 1];
    const currentText = cleanWhitespace(currentItems.map((entry) => entry.text).join(' '));
    const nextGap = nextItem ? nextItem.offset - (item.offset + item.duration) : 0;

    if (
      shouldCloseTranscriptBlock({
        text: currentText,
        nextGap,
        isLastItem: index === transcript.length - 1,
      })
    ) {
      pushCurrentBlock();
    }
  });

  return blocks;
};

const extractQuestionPhrases = (question) => {
  const matches = [...question.matchAll(/"([^"]+)"/g)];
  return matches.map((match) => cleanWhitespace(match[1].toLowerCase())).filter(Boolean);
};

const parseTimestampToMs = (value) => {
  const parts = value.split(':').map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return ((minutes * 60) + seconds) * 1000;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (((hours * 60 * 60) + (minutes * 60) + seconds) * 1000);
  }

  return null;
};

const extractRequestedTimestampMs = (question) => {
  const match = question.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
  return match ? parseTimestampToMs(match[0]) : null;
};

const buildQuestionProfile = (question) => {
  const normalizedQuestion = cleanWhitespace(question.toLowerCase());
  const questionTerms = tokenize(question).filter(
    (word) => word.length > 2 && !STOP_WORDS.has(word),
  );

  return {
    normalizedQuestion,
    questionTerms,
    questionPhrases: extractQuestionPhrases(question),
    requestedTimestampMs: extractRequestedTimestampMs(question),
    wantsSummary: SUMMARY_HINTS.some((hint) => normalizedQuestion.includes(hint)),
  };
};

const scoreQuestionMatch = ({ haystack, questionTerms, questionPhrases, startMs, requestedTimestampMs }) => {
  let score = 0;

  questionTerms.forEach((term) => {
    if (haystack.includes(term)) {
      score += term.length >= 6 ? 3 : 2;
    }
  });

  questionPhrases.forEach((phrase) => {
    if (haystack.includes(phrase)) {
      score += 5;
    }
  });

  if (requestedTimestampMs !== null) {
    const distance = Math.abs(startMs - requestedTimestampMs);
    score += Math.max(0, 12 - Math.floor(distance / 30000));
  }

  return score;
};

const pickDistinctEntries = (entries, getStartMs, limit = 3, minGapMs = 45000) => {
  const selected = [];

  entries.forEach((entry) => {
    if (selected.length >= limit) {
      return;
    }

    if (selected.every((chosen) => Math.abs(getStartMs(chosen) - getStartMs(entry)) >= minGapMs)) {
      selected.push(entry);
    }
  });

  return selected;
};

const findNearestSegment = (analysis, timestampMs) =>
  analysis.segments
    .map((segment) => ({
      segment,
      distance: Math.min(
        Math.abs(segment.startMs - timestampMs),
        Math.abs(segment.endMs - timestampMs),
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.segment || null;

const findNearestTranscriptBlock = (analysis, timestampMs) =>
  analysis.transcript.blocks
    .map((block) => ({
      block,
      distance: Math.min(
        Math.abs(block.startMs - timestampMs),
        Math.abs(block.endMs - timestampMs),
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.block || null;

const findSegmentForBlock = (analysis, block) =>
  analysis.segments.find((segment) => block.startMs >= segment.startMs && block.startMs <= segment.endMs) ||
  findNearestSegment(analysis, block.startMs);

const buildChatCitations = (segments = [], blocks = []) => {
  const items = [
    ...blocks.map((block) => ({
      label: block.startLabel,
      title: 'Transcript detail',
      startMs: block.startMs,
    })),
    ...segments.map((segment) => ({
      label: segment.startLabel,
      title: segment.title,
      startMs: segment.startMs,
    })),
  ]
    .sort((a, b) => a.startMs - b.startMs)
    .filter((item, index, list) => index === list.findIndex((entry) => entry.label === item.label));

  return items.slice(0, 4).map(({ label, title }) => ({ label, title }));
};

const buildSummaryAnswer = (analysis) => {
  const summarySegments = analysis.segments.slice(0, 4);
  const numberedSummary = summarySegments
    .map((segment, index) => `${index + 1}. ${segment.startLabel} - ${segment.summary}`)
    .join('\n');

  const answer = [
    `Here’s a detailed summary of "${analysis.title}" grounded in the transcript.`,
    numberedSummary,
    `Overall, the lecture is mainly about ${analysis.keyThemes.slice(0, 3).join(', ')}.`,
  ].join('\n\n');

  return {
    answer,
    citations: buildChatCitations(summarySegments),
  };
};

const buildTimestampAnswer = (analysis, requestedTimestampMs) => {
  const block = findNearestTranscriptBlock(analysis, requestedTimestampMs);
  const segment = findNearestSegment(analysis, requestedTimestampMs);

  if (!block || !segment) {
    return null;
  }

  const answer = [
    `Here’s the closest grounded answer to ${formatTimestamp(requestedTimestampMs)} from the transcript.`,
    `Closest transcript moment (${block.startLabel})\n${buildReadableSnippet(block.text)}`,
    `What that section is doing\n${segment.summary}`,
    `Context\nThis appears inside "${segment.title}" and helps explain how the speaker develops the idea at that point in the video.`,
  ].join('\n\n');

  return {
    answer,
    citations: buildChatCitations([segment], [block]),
  };
};

const buildDetailedMatchAnswer = ({ analysis, matchedSegments, matchedBlocks }) => {
  const primaryBlock = matchedBlocks[0];
  const supportingBlocks = matchedBlocks.slice(1, 3);
  const primarySegment = primaryBlock ? findSegmentForBlock(analysis, primaryBlock) : matchedSegments[0] || null;
  const supportingSegments = matchedSegments.filter((segment) => segment.id !== primarySegment?.id).slice(0, 2);
  const supportLines = [
    ...supportingBlocks.map(
      (block, index) =>
        `${index + 1}. ${block.startLabel} - ${buildReadableSnippet(block.text)}`,
    ),
    ...supportingSegments.map(
      (segment, index) =>
        `${supportingBlocks.length + index + 1}. ${segment.startLabel} - ${segment.summary}`,
    ),
  ].slice(0, 3);
  const takeawaySource = supportingSegments[0]?.summary || matchedSegments[0]?.summary || analysis.overview[0];

  if (!primaryBlock || !primarySegment) {
    return {
      answer:
        `I couldn't find a precise transcript passage for that question, but the closest themes in this lecture are ${analysis.keyThemes
          .slice(0, 3)
          .join(', ')}. Try asking about a named concept, a claim, or a timestamp like 12:40.`,
      citations: buildChatCitations(analysis.segments.slice(0, 2)),
    };
  }

  const answerSections = [
    'Here’s a more detailed answer grounded in the transcript.',
    `Primary explanation (${primaryBlock.startLabel})\n${buildReadableSnippet(primaryBlock.text)}\n\nThis sits inside "${primarySegment.title}", where the lecture frames the idea this way: ${primarySegment.summary}`,
  ];

  if (supportLines.length > 0) {
    answerSections.push(`Supporting moments\n${supportLines.join('\n')}`);
  }

  if (takeawaySource) {
    answerSections.push(`Bottom line\n${takeawaySource}`);
  }

  return {
    answer: answerSections.join('\n\n'),
    citations: buildChatCitations(
      [primarySegment, ...supportingSegments].filter(Boolean),
      [primaryBlock, ...supportingBlocks].filter(Boolean),
    ),
  };
};

const pickRepresentativeSentences = (items, limit = 2) => {
  const keywordScores = getKeywordFrequency(items.map((item) => item.text));

  const ranked = buildCandidateBlocks(items)
    .map((block) => ({
      ...block,
      score: scoreTextByKeywords(block.text, keywordScores),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .sort((a, b) => a.startIndex - b.startIndex)
    .map(({ text }) => text)
    .filter((text, index, list) => text.length > 20 && list.indexOf(text) === index);

  if (ranked.length > 0) {
    return ranked;
  }

  return items
    .slice(0, limit)
    .map((item) => cleanWhitespace(item.text))
    .filter(Boolean);
};

const buildSegmentTitle = (keywords, index) => {
  const prefix = TITLE_PREFIXES[index] || `Key Moment ${index + 1}`;

  if (keywords.length === 0) {
    return prefix;
  }

  return `${prefix}: ${keywords.slice(0, 2).map(toTitleCase).join(' • ')}`;
};

const estimateSegmentCount = (totalDurationMs, transcriptLength) => {
  const byDuration = Math.round(totalDurationMs / 240000);
  const byDensity = Math.round(transcriptLength / 70);

  return clamp(Math.max(byDuration, byDensity, 4), 4, 7);
};

const groupTranscriptByWindow = (transcript, totalDurationMs, segmentCount) => {
  const windowSize = Math.max(1, totalDurationMs / segmentCount);

  return Array.from({ length: segmentCount }, (_, index) => {
    const startMs = Math.floor(index * windowSize);
    const endMs = index === segmentCount - 1 ? totalDurationMs : Math.floor((index + 1) * windowSize);
    const items = transcript.filter((item) => item.offset >= startMs && item.offset < endMs);

    return {
      index,
      startMs,
      endMs,
      items: items.length > 0 ? items : transcript.slice(index * 2, index * 2 + 4),
    };
  }).filter((segment) => segment.items.length > 0);
};

export const extractYouTubeVideoId = (value) => {
  const normalized = value.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(normalized)) {
    return normalized;
  }

  try {
    const url = new URL(normalized);

    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '').slice(0, 11);
    }

    if (url.searchParams.get('v')) {
      return url.searchParams.get('v');
    }

    const pathParts = url.pathname.split('/').filter(Boolean);
    const candidate = pathParts[pathParts.length - 1];
    return candidate?.slice(0, 11) || '';
  } catch {
    return '';
  }
};

export const formatTimestamp = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const buildVideoAnalysis = ({ url, metadata, transcript, requestedAt = new Date().toISOString() }) => {
  const safeTranscript = normalizeTranscript(transcript);
  const totalDurationMs = safeTranscript.length
    ? safeTranscript[safeTranscript.length - 1].offset + safeTranscript[safeTranscript.length - 1].duration
    : 0;
  const segmentCount = estimateSegmentCount(totalDurationMs, safeTranscript.length);
  const groupedSegments = groupTranscriptByWindow(safeTranscript, totalDurationMs, segmentCount);
  const transcriptText = safeTranscript.map((item) => item.text).join(' ');
  const transcriptBlocks = buildTranscriptBlocks(safeTranscript);
  const globalKeywords = getTopKeywords([transcriptText], 6);
  const transcriptWordCount = tokenize(transcriptText).length;

  const segments = groupedSegments.map((segment) => {
    const keywords = getTopKeywords(segment.items.map((item) => item.text), 3);
    const representativeLines = pickRepresentativeSentences(segment.items, 1);

    return {
      id: `segment-${segment.index + 1}`,
      startMs: segment.startMs,
      endMs: segment.endMs,
      startLabel: formatTimestamp(segment.startMs),
      endLabel: formatTimestamp(segment.endMs),
      title: buildSegmentTitle(keywords, segment.index),
      summary: representativeLines.join(' '),
      keywords,
      searchText: cleanWhitespace(segment.items.map((item) => item.text).join(' ')),
    };
  });

  const overview = segments
    .slice(0, 3)
    .map((segment) => segment.summary)
    .filter(Boolean);

  return {
    requestedAt,
    videoId: extractYouTubeVideoId(url),
    sourceUrl: url,
    title: metadata.title,
    author: metadata.author_name,
    authorUrl: metadata.author_url,
    thumbnailUrl: metadata.thumbnail_url,
    embedUrl: `https://www.youtube.com/embed/${extractYouTubeVideoId(url)}`,
    transcriptLanguage: safeTranscript[0]?.lang || 'unknown',
    transcriptItemCount: safeTranscript.length,
    transcriptWordCount,
    transcript: {
      fullText: transcriptText,
      timestampedText: transcriptBlocks
        .map((block) => `[${block.startLabel}] ${block.text}`)
        .join('\n\n'),
      blocks: transcriptBlocks,
    },
    durationMs: totalDurationMs,
    durationLabel: formatTimestamp(totalDurationMs),
    keyThemes: globalKeywords.map(toTitleCase),
    overview,
    segments,
  };
};

export const answerTranscriptQuestion = (question, analysis) => {
  const profile = buildQuestionProfile(question);

  if (profile.wantsSummary) {
    return buildSummaryAnswer(analysis);
  }

  if (profile.requestedTimestampMs !== null) {
    const timestampAnswer = buildTimestampAnswer(analysis, profile.requestedTimestampMs);

    if (timestampAnswer) {
      return timestampAnswer;
    }
  }

  const rankedSegments = analysis.segments
    .map((segment) => {
      const haystack = `${segment.title} ${segment.summary} ${segment.searchText}`.toLowerCase();
      return {
        segment,
        score: scoreQuestionMatch({
          haystack,
          questionTerms: profile.questionTerms,
          questionPhrases: profile.questionPhrases,
          startMs: segment.startMs,
          requestedTimestampMs: profile.requestedTimestampMs,
        }),
      };
    })
    .sort((a, b) => b.score - a.score);
  const rankedBlocks = analysis.transcript.blocks
    .map((block) => ({
      block,
      score: scoreQuestionMatch({
        haystack: block.text.toLowerCase(),
        questionTerms: profile.questionTerms,
        questionPhrases: profile.questionPhrases,
        startMs: block.startMs,
        requestedTimestampMs: profile.requestedTimestampMs,
      }),
    }))
    .sort((a, b) => b.score - a.score);

  const matchedSegments = pickDistinctEntries(
    rankedSegments.filter((entry) => entry.score > 0).map((entry) => entry.segment),
    (segment) => segment.startMs,
    3,
  );
  const matchedBlocks = pickDistinctEntries(
    rankedBlocks.filter((entry) => entry.score > 0).map((entry) => entry.block),
    (block) => block.startMs,
    3,
  );

  return buildDetailedMatchAnswer({
    analysis,
    matchedSegments,
    matchedBlocks,
  });
};
