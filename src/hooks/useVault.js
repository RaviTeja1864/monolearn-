import { useState, useEffect } from 'react';

export const useVault = () => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('studyos-vault');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('studyos-vault-history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('studyos-vault', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('studyos-vault-history', JSON.stringify(history));
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
        tags: ["Core", "Intro"],
        preview: "Supervised vs Unsupervised learning overview..."
      },
      {
        name: "OS Kernel Architecture.mp4",
        type: "video",
        size: "128 MB",
        subject: "Operating Systems",
        tags: ["Lecture", "Kernel"],
        preview: "Detailed breakdown of monolithic vs microkernels..."
      },
      {
        name: "DataStructures_Final_Review.txt",
        type: "text",
        size: "15 KB",
        subject: "Data Structures",
        tags: ["Exam", "Review"],
        preview: "Complexity analysis of tree balancing algorithms..."
      },
      {
        name: "sorting_algorithms.py",
        type: "code",
        size: "8 KB",
        subject: "Computer Science",
        tags: ["Python", "Algorithms"],
        preview: "def quicksort(arr): # Optimized pivot selection..."
      }
    ];
    samples.forEach(sample => addItem(sample));
    addHistoryEvent('SYSTEM', { message: 'Sample course pack loaded' });
  };

  const clearHistory = () => setHistory([]);

  return { items, history, addItem, deleteItems, updateItem, loadSampleData, clearHistory };
};
