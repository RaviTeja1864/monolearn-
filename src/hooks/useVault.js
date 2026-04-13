import { useState, useEffect } from 'react';

const VAULT_KEY = 'solo-tutor-vault';
const LEGACY_VAULT_KEY = 'studyos-vault';
const HISTORY_KEY = 'solo-tutor-vault-history';
const LEGACY_HISTORY_KEY = 'studyos-vault-history';

export const useVault = () => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem(VAULT_KEY) || localStorage.getItem(LEGACY_VAULT_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState(() => {
    const saved =
      localStorage.getItem(HISTORY_KEY) || localStorage.getItem(LEGACY_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(VAULT_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const addHistoryEvent = (type, details) => {
    const newEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      ...details
    };
    setHistory(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
  };

  const addItem = (item) => {
    const newItem = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      tags: item.tags || [],
      ...item
    };
    setItems(prev => [newItem, ...prev]);
    addHistoryEvent('UPLOAD', { name: newItem.name, fileType: newItem.type });
    return newItem;
  };

  const deleteItems = (ids) => {
    const deletedItems = items.filter(item => ids.includes(item.id));
    setItems(prev => prev.filter(item => !ids.includes(item.id)));
    deletedItems.forEach(item => {
      addHistoryEvent('DELETE', { name: item.name });
    });
  };

  const updateItem = (id, updates) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        addHistoryEvent('UPDATE', { name: item.name, changes: Object.keys(updates) });
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  const loadSampleData = () => {
    const samples = [
      {
        name: "Machine Learning Foundations.pdf",
        type: "pdf",
        size: "4.2 MB",
        subject: "Machine Learning",
        tags: ["Core", "Intro", "Neural"],
        preview: "Supervised vs unsupervised learning, feature spaces, and practical model evaluation..."
      },
      {
        name: "OS Kernel Architecture.mp4",
        type: "video",
        size: "128 MB",
        subject: "Operating Systems",
        tags: ["Lecture", "Kernel", "Systems"],
        preview: "Detailed breakdown of monolithic vs microkernels, scheduling, and protection boundaries..."
      },
      {
        name: "Deadlock Recovery Lab Notes.md",
        type: "text",
        size: "21 KB",
        subject: "Operating Systems",
        tags: ["Lab", "Deadlocks", "Review"],
        preview: "Deadlock detection graphs, recovery heuristics, and starvation trade-offs..."
      },
      {
        name: "Recursion_Patterns.cpp",
        type: "code",
        size: "11 KB",
        subject: "Data Structures",
        tags: ["C++", "Recursion", "DSA"],
        preview: "int solve(int n) { /* recursive state transitions with memoization hooks */ }"
      },
      {
        name: "Backpropagation Debug Walkthrough.mp4",
        type: "video",
        size: "164 MB",
        subject: "Machine Learning",
        tags: ["Lecture", "Gradients", "ML"],
        preview: "Vanishing gradient intuition, activation choices, and debugging unstable training runs..."
      },
      {
        name: "Gradient_Descent_Debugger.py",
        type: "code",
        size: "9 KB",
        subject: "Machine Learning",
        tags: ["Python", "Optimization", "ML"],
        preview: "def train_step(weights, batch): # gradient inspection and clipping strategy..."
      },
      {
        name: "Graph_Traversal_Cheat_Sheet.pdf",
        type: "pdf",
        size: "1.8 MB",
        subject: "Data Structures",
        tags: ["Graphs", "Revision", "DSA"],
        preview: "BFS, DFS, shortest paths, and adjacency list trade-offs for exam recall..."
      }
    ];

    const existingNames = new Set(items.map(item => item.name));
    const newSamples = samples.filter(sample => !existingNames.has(sample.name));

    if (newSamples.length === 0) {
      addHistoryEvent('SYSTEM', { message: 'Sample course pack already indexed' });
      return;
    }

    newSamples.forEach(sample => addItem(sample));
    addHistoryEvent('SYSTEM', { message: 'Sample course pack loaded' });
  };

  const clearHistory = () => setHistory([]);

  return { items, history, addItem, deleteItems, updateItem, loadSampleData, clearHistory };
};
