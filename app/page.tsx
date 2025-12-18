'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';
import {
  FileText,
  Download,
  GitBranch
} from 'lucide-react';

export default function Page() {
  const [activeTab, setActiveTab] = useState<any>('input');
  const [analysis, setAnalysis] = useState<any>(null);

  const renderFlowchart = () => {
    return (
      <div style={{ background: '#ffffff', padding: 24, borderRadius: 10 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitBranch size={20} />
          ASC 718 Decision Flowchart
        </h2>

        <svg
          width="100%"
          height="700"
          viewBox="0 0 800 700"
        >
          <defs>
            <marker
              id="arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#1e3a8a" />
            </marker>
          </defs>

          <rect x="250" y="20" width="300" height="60" rx="6" fill="#2563eb" />
          <text x="400" y="55" textAnchor="middle" fill="#ffffff" fontSize="16">
            Secondary Market Transaction
          </text>

          <line x1="400" y1="80" x2="400" y2="120" stroke="#1e3a8a" markerEnd="url(#arrow)" />

          <polygon points="400,120 500,180 400,240 300,180" fill="#fde68a" />
          <text x="400" y="185" textAnchor="middle" fontSize="14">
            Seller an Investor?
          </text>

          <line x1="500" y1="180" x2="650" y2="180" stroke="#1e3a8a" markerEnd="url(#arrow)" />
          <rect x="650" y="150" width="120" height="60" rx="6" fill="#dcfce7" />
          <text x="710" y="185" textAnchor="middle" fontSize="12">
            Capital / Distribution
          </text>

          <line x1="400" y1="240" x2="400" y2="280" stroke="#1e3a8a" markerEnd="url(#arrow)" />

          <polygon points="400,280 500,340 400,400 300,340" fill="#fde68a" />
          <text x="400" y="345" textAnchor="middle" fontSize="14">
            Price > Fair Value?
          </text>

          <line x1="300" y1="340" x2="150" y2="340" stroke="#1e3a8a" markerEnd="url(#arrow)" />
          <rect x="40" y="310" width="110" height="60" rx="6" fill="#dcfce7" />
          <text x="95" y="345" textAnchor="middle" fontSize="12">
            No Compensation
          </text>

          <line x1="400" y1="400" x2="400" y2="440" stroke="#1e3a8a" markerEnd="url(#arrow)" />
          <rect x="320" y="440" width="160" height="60" rx="6" fill="#fee2e2" />
          <text x="400" y="475" textAnchor="middle" fontSize="12">
            Compensatory (ASC 718)
          </text>
        </svg>
      </div>
    );
  };

  const renderMemo = () => {
    return (
      <div style={{ background: '#ffffff', padding: 24, borderRadius: 10 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} />
          Accounting Memo
        </h2>

        <pre
          style={{
            background: '#f8fafc',
            padding: 16,
            borderRadius: 6,
            whiteSpace: 'pre-wrap',
            fontSize: 13,
            marginTop: 16
          }}
        >
{`ACCOUNTING MEMORANDUM

This memo summarizes the ASC 718 analysis for a secondary
market transaction. Based on the transaction facts,
the excess consideration may represent compensation cost
depending on buyer type, seller status, and entity involvement.`}
        </pre>

        <button
          style={{
            marginTop: 16,
            padding: '10px 16px',
            background: '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Download size={16} />
          Download Memo
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
          color: '#ffffff',
          padding: 24,
          borderRadius: 10,
          marginBottom: 24
        }}
      >
        <h1 style={{ margin: 0 }}>Secondary Market Transaction Analysis</h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>
          ASC 718 Compensation & Classification Tool
        </p>
      </header>

      <nav style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setActiveTab('input')}>Input</button>
        <button onClick={() => setActiveTab('flowchart')}>Flowchart</button>
        <button onClick={() => setActiveTab('memo')}>Memo</button>
      </nav>

      {activeTab === 'input' && (
        <div style={{ background: '#ffffff', padding: 24, borderRadius: 10 }}>
          <p>Input form goes here.</p>
        </div>
      )}

      {activeTab === 'flowchart' && renderFlowchart()}
      {activeTab === 'memo' && renderMemo()}
    </div>
  );
}
