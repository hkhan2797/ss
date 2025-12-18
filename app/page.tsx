'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { FileText } from 'lucide-react';

export default function Page(): any {
  const [activeTab, setActiveTab] = useState<any>('input');

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1000px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div
        style={{
          background: '#1e3a8a',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}
      >
        <h1 style={{ margin: 0 }}>
          Secondary Market Transaction Analysis
        </h1>
        <p style={{ marginTop: '8px', opacity: 0.9 }}>
          ASC 718 Compensation Assessment Tool
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('input')}
          style={{ padding: '8px 16px' }}
        >
          Input
        </button>

        <button
          onClick={() => setActiveTab('memo')}
          style={{ padding: '8px 16px' }}
        >
          Memo
        </button>
      </div>

      {activeTab === 'input' && (
        <div
          style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px'
          }}
        >
          <p>This is the input section.</p>
        </div>
      )}

      {activeTab === 'memo' && (
        <div
          style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} />
            Accounting Memo
          </h2>

          <pre
            style={{
              marginTop: '16px',
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '6px',
              whiteSpace: 'pre-wrap'
            }}
          >
{`ACCOUNTING MEMORANDUM

This memo documents the ASC 718 analysis
for a secondary market transaction.

Further analysis logic can be added safely
after deployment is confirmed.`}
          </pre>
        </div>
      )}
    </div>
  );
}
