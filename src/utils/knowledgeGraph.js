const GRAPH_WIDTH = 1180;
const GRAPH_HEIGHT = 760;

const subjectBlueprints = {
  'Machine Learning': {
    concepts: ['Neural Networks', 'Vanishing Gradient', 'Backpropagation', 'Gradient Descent'],
    description:
      'Model behavior, unstable gradients, and optimization patterns extracted from your ML materials.',
    edgeColor: 'rgba(96, 165, 250, 0.42)',
    glow: 'from-sky-500/18 via-violet-500/8 to-transparent',
    chip: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
  },
  'Operating Systems': {
    concepts: ['Kernel Isolation', 'Process Scheduling', 'Deadlocks', 'Resource Allocation'],
    description:
      'System orchestration, protection boundaries, and concurrency patterns inferred from your OS vault.',
    edgeColor: 'rgba(34, 211, 238, 0.42)',
    glow: 'from-cyan-500/18 via-sky-500/8 to-transparent',
    chip: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100',
  },
  'Data Structures': {
    concepts: ['Recursion Trees', 'Memoization', 'Graph Traversal', 'Time Complexity'],
    description:
      'Algorithmic building blocks and performance trade-offs woven from your DSA revision set.',
    edgeColor: 'rgba(16, 185, 129, 0.42)',
    glow: 'from-emerald-500/18 via-sky-500/8 to-transparent',
    chip: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
  },
  General: {
    concepts: ['Core Notes', 'Connected Review', 'Practice Loop'],
    description: 'A general learning spine built from mixed materials in your vault.',
    edgeColor: 'rgba(255, 255, 255, 0.22)',
    glow: 'from-white/10 via-white/[0.04] to-transparent',
    chip: 'border-white/10 bg-white/[0.04] text-foreground/80',
  },
};

const keywordConcepts = [
  { pattern: /neural|model|activation/, concept: 'Neural Networks', subject: 'Machine Learning' },
  { pattern: /gradient|unstable/, concept: 'Vanishing Gradient', subject: 'Machine Learning' },
  { pattern: /backprop|training/, concept: 'Backpropagation', subject: 'Machine Learning' },
  { pattern: /optimizer|descent/, concept: 'Gradient Descent', subject: 'Machine Learning' },
  { pattern: /kernel|monolithic|microkernel/, concept: 'Kernel Isolation', subject: 'Operating Systems' },
  { pattern: /process|schedule|concurrency/, concept: 'Process Scheduling', subject: 'Operating Systems' },
  { pattern: /deadlock|starvation|resource/, concept: 'Deadlocks', subject: 'Operating Systems' },
  { pattern: /allocation|recovery/, concept: 'Resource Allocation', subject: 'Operating Systems' },
  { pattern: /recursion|recursive/, concept: 'Recursion Trees', subject: 'Data Structures' },
  { pattern: /memoization|cache/, concept: 'Memoization', subject: 'Data Structures' },
  { pattern: /graph|bfs|dfs|shortest/, concept: 'Graph Traversal', subject: 'Data Structures' },
  { pattern: /complexity|runtime|big o/, concept: 'Time Complexity', subject: 'Data Structures' },
];

const createSeededRandom = (seed) => {
  let value = seed % 2147483647;

  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getSubjectConfig = (subject) => subjectBlueprints[subject] || subjectBlueprints.General;

const unique = (values) => [...new Set(values.filter(Boolean))];

const getNormalizedText = (item) =>
  [item.name, item.subject, item.preview, ...(item.tags || [])].join(' ').toLowerCase();

const inferSubject = (item) => item.subject || 'General';

const inferConceptsForItem = (item) => {
  const subject = inferSubject(item);
  const blueprint = getSubjectConfig(subject);
  const normalized = getNormalizedText(item);
  const concepts = [];

  keywordConcepts.forEach(({ pattern, concept, subject: matchSubject }) => {
    if ((matchSubject === subject || subject === 'General') && pattern.test(normalized)) {
      concepts.push(concept);
    }
  });

  if (concepts.length === 0) {
    concepts.push(...blueprint.concepts.slice(0, 2));
  } else {
    concepts.unshift(...blueprint.concepts.slice(0, 1));
  }

  return unique(concepts).slice(0, 3);
};

const buildSubjectLanes = (subjects) => {
  const laneGap = GRAPH_WIDTH / (subjects.length + 1);
  return subjects.reduce((accumulator, subject, index) => {
    accumulator[subject] = laneGap * (index + 1);
    return accumulator;
  }, {});
};

const getConceptDescription = (subject, concept) => {
  const blueprint = getSubjectConfig(subject);

  if (blueprint.concepts.includes(concept)) {
    return `${concept} linked across your ${subject} materials. ${blueprint.description}`;
  }

  return `${concept} surfaced from tags, filenames, and preview snippets in your ${subject} vault.`;
};

const buildCrossLinks = (subjectConceptNodes) => {
  const edges = [];

  subjectConceptNodes.slice(0, -1).forEach((currentNodes, index) => {
    const nextNodes = subjectConceptNodes[index + 1];
    const source = currentNodes[currentNodes.length - 1];
    const target = nextNodes[0];

    if (source && target) {
      edges.push({
        id: `bridge-${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        color: 'rgba(255, 255, 255, 0.14)',
        strength: 'bridge',
      });
    }
  });

  return edges;
};

export const graphCanvas = {
  width: GRAPH_WIDTH,
  height: GRAPH_HEIGHT,
};

export const getNodeAccent = (subject) => getSubjectConfig(subject);

export const buildKnowledgeGraph = (items, seed) => {
  const random = createSeededRandom(seed);
  const subjectGroups = items.reduce((accumulator, item) => {
    const subject = inferSubject(item);

    if (!accumulator[subject]) {
      accumulator[subject] = [];
    }

    accumulator[subject].push(item);
    return accumulator;
  }, {});

  const subjects = Object.keys(subjectGroups);
  const lanes = buildSubjectLanes(subjects.length > 0 ? subjects : ['General']);
  const nodes = [];
  const edges = [];
  const conceptCollections = [];

  subjects.forEach((subject, subjectIndex) => {
    const subjectItems = subjectGroups[subject];
    const blueprint = getSubjectConfig(subject);
    const laneX = lanes[subject];
    const conceptSeed = unique(
      subjectItems.flatMap((item) => inferConceptsForItem(item)).concat(blueprint.concepts),
    ).slice(0, Math.min(4, Math.max(2, subjectItems.length + 1)));

    const subjectConceptNodes = conceptSeed.map((concept, conceptIndex) => {
      const id = `concept-${slugify(subject)}-${slugify(concept)}`;
      const y = 120 + conceptIndex * 110 + random() * 24;
      const x = clamp(
        laneX + (random() - 0.5) * 120 + (conceptIndex % 2 === 0 ? -18 : 18),
        110,
        GRAPH_WIDTH - 110,
      );
      const node = {
        id,
        type: 'concept',
        label: concept,
        subject,
        relatedItemIds: subjectItems.map((item) => item.id),
        position: { x, y },
        snippet: getConceptDescription(subject, concept),
      };

      nodes.push(node);
      return node;
    });

    subjectConceptNodes.forEach((node, conceptIndex) => {
      if (subjectConceptNodes[conceptIndex + 1]) {
        edges.push({
          id: `concept-link-${node.id}-${subjectConceptNodes[conceptIndex + 1].id}`,
          source: node.id,
          target: subjectConceptNodes[conceptIndex + 1].id,
          color: blueprint.edgeColor,
          strength: 'concept',
        });
      }
    });

    const itemStartY = 450 + subjectIndex * 14;

    subjectItems.forEach((item, itemIndex) => {
      const id = `item-${item.id}`;
      const linkedConcepts = inferConceptsForItem(item);
      const node = {
        id,
        type: 'item',
        label: item.name,
        subject,
        relatedItemIds: [item.id],
        position: {
          x: clamp(laneX + (random() - 0.5) * 200, 100, GRAPH_WIDTH - 100),
          y: clamp(itemStartY + itemIndex * 118 + random() * 20, 390, GRAPH_HEIGHT - 90),
        },
        snippet:
          item.preview ||
          `Vault asset from ${subject}. Open this in Knowledge Chat to review it in context.`,
      };

      nodes.push(node);

      linkedConcepts.forEach((concept, conceptIndex) => {
        const conceptNode = subjectConceptNodes.find((candidate) => candidate.label === concept);

        if (conceptNode) {
          edges.push({
            id: `item-link-${id}-${conceptNode.id}-${conceptIndex}`,
            source: id,
            target: conceptNode.id,
            color: blueprint.edgeColor,
            strength: 'item',
          });
        }
      });
    });

    conceptCollections.push(subjectConceptNodes);
  });

  edges.push(...buildCrossLinks(conceptCollections));

  return {
    nodes,
    edges,
    meta: {
      conceptCount: nodes.filter((node) => node.type === 'concept').length,
      documentCount: nodes.filter((node) => node.type === 'item').length,
      subjectCount: subjects.length,
    },
  };
};

export const createGraphSignature = (items) =>
  items.map((item) => `${item.id}:${item.subject}:${item.type}`).join('|');

export const clampNodePosition = (position, nodeType) => ({
  x: clamp(position.x, 90, GRAPH_WIDTH - 90),
  y: clamp(position.y, nodeType === 'concept' ? 80 : 320, GRAPH_HEIGHT - 70),
});
