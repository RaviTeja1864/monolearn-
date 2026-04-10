import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  ArrowRight, 
  Trophy, 
  BookOpen, 
  Zap,
  BarChart3,
  Filter,
  Check,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useVault } from '../hooks/useVault';
import { cn } from '../utils/cn';

const QuizLab = () => {
  const { items } = useVault();
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [mastery, setMastery] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('all');

  const subjects = ['all', ...new Set(items.map(item => item.subject).filter(Boolean))];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const mockQuestions = [
        {
          id: 1,
          question: "Which of the following describes the time complexity of a recursive Fibonacci function without memoization?",
          options: ["O(n)", "O(log n)", "O(2^n)", "O(n log n)"],
          correct: 2,
          explanation: "Each call results in two more recursive calls, leading to exponential growth in the total number of calls.",
          source: "sorting_algorithms.py"
        },
        {
          id: 2,
          question: "What is the primary difference between a Monolithic Kernel and a Microkernel?",
          options: [
            "Monolithic kernels are faster but harder to debug",
            "Microkernels run all services in user space",
            "Monolithic kernels are smaller in size",
            "Microkernels are inherently less secure"
          ],
          correct: 1,
          explanation: "Microkernels minimize the code running in kernel space, moving services like file systems and drivers to user space.",
          source: "OS Kernel Architecture.mp4"
        },
        {
          id: 3,
          question: "In supervised learning, what is the main goal of the model?",
          options: [
            "To find hidden patterns in unlabeled data",
            "To learn a mapping from input features to output labels",
            "To maximize a reward signal in an environment",
            "To reduce the dimensionality of the input space"
          ],
          correct: 1,
          explanation: "Supervised learning uses labeled training data to learn a function that can predict outcomes for new, unseen data.",
          source: "Machine Learning Foundations.pdf"
        }
      ];
      
      setQuizData(mockQuestions);
      setQuizStarted(true);
      setIsGenerating(false);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedOption(null);
      setShowExplanation(false);
    }, 1500);
  };

  const handleOptionSelect = (idx) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === quizData[currentQuestionIndex].correct) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setMastery(Math.round((score / quizData.length) * 100));
      setQuizStarted(false);
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizData([]);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Quiz Header Stats */}
      {!isGenerating && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-secondary rounded-2xl">
              <Trophy className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Mastery</p>
              <h4 className="text-xl font-black">{mastery}%</h4>
            </div>
          </div>
          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-secondary rounded-2xl">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Topics Mastered</p>
              <h4 className="text-xl font-black">{mastery > 70 ? '8' : '3'} / 12</h4>
            </div>
          </div>
          <div className="bg-foreground text-background rounded-3xl p-6 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-background/10 rounded-2xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Global Rank</p>
              <h4 className="text-xl font-black">Top 5%</h4>
            </div>
          </div>
        </div>
      )}

      {!quizStarted ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-8 bg-secondary/10 rounded-[40px] border-2 border-dashed border-border/40">
          <div className="p-4 bg-card rounded-3xl border border-border shadow-sm">
            <HelpCircle className="w-10 h-10 text-foreground" />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold">Adaptive Quiz Lab</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              Generate personalized quizzes from your vault. Our AI adapts difficulty based on your previous performance.
            </p>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground text-center">Select Subject Focus</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {subjects.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all",
                      selectedSubject === sub 
                        ? "bg-foreground text-background border-foreground" 
                        : "bg-card text-muted-foreground border-border/60 hover:border-foreground/40"
                    )}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || items.length === 0}
              className="w-full py-4 bg-foreground text-background rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-foreground/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? "Synthesizing Quiz..." : "Generate Neural Quiz"}
            </button>
            {items.length === 0 && (
              <p className="text-[10px] text-center text-red-500 font-bold uppercase tracking-widest">
                Upload materials to the vault to start
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          {/* Quiz Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={resetQuiz} className="p-2 hover:bg-secondary rounded-xl transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-widest">Neural Evaluation</h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Question {currentQuestionIndex + 1} of {quizData.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl border border-border/40">
              <Trophy className="w-4 h-4 text-foreground/50" />
              <span className="text-sm font-black tracking-tight">{score}</span>
            </div>
          </div>

          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-foreground transition-all duration-500 ease-out" 
              style={{ width: `${((currentQuestionIndex + 1) / quizData.length) * 100}%` }} 
            />
          </div>

          {/* Question Card */}
          <div className="bg-card border border-border/40 rounded-[40px] p-8 md:p-12 shadow-sm space-y-10 animate-in slide-in-from-right-4 duration-500">
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-black">
                      {currentQuestionIndex + 1}
                   </div>
                   <div className="h-px flex-1 bg-border/40" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold leading-tight">
                   {quizData[currentQuestionIndex].question}
                </h3>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {quizData[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={cn(
                      "group w-full p-5 rounded-2xl border text-left text-[14px] font-medium transition-all flex items-center justify-between",
                      selectedOption === null 
                        ? "bg-secondary/30 border-border/40 hover:border-foreground/40 hover:bg-secondary/50"
                        : idx === quizData[currentQuestionIndex].correct
                          ? "bg-green-500/10 border-green-500/40 text-green-700"
                          : selectedOption === idx
                            ? "bg-red-500/10 border-red-500/40 text-red-700"
                            : "bg-secondary/10 border-border/20 opacity-50"
                    )}
                  >
                    <span>{option}</span>
                    {selectedOption !== null && idx === quizData[currentQuestionIndex].correct && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {selectedOption === idx && idx !== quizData[currentQuestionIndex].correct && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </button>
                ))}
             </div>

             {showExplanation && (
               <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="p-6 bg-secondary/30 rounded-3xl border border-border/40 space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <BookOpen className="w-4 h-4 text-muted-foreground" />
                           <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">AI Insights</h4>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-foreground text-background rounded-md text-[9px] font-black uppercase tracking-widest">
                           Source: {quizData[currentQuestionIndex].source}
                        </div>
                     </div>
                     <p className="text-[13px] leading-relaxed text-foreground/80 font-medium">
                        {quizData[currentQuestionIndex].explanation}
                     </p>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full py-5 bg-foreground text-background rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-foreground/10"
                  >
                    {currentQuestionIndex < quizData.length - 1 ? "Next Analysis" : "View Final Results"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizLab;
