'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, Info, FileText, Download, GitBranch } from 'lucide-react';

const SecondaryMarketCalculator = () => {
  const [inputs, setInputs] = useState({
    companyName: '',
    transactionDate: '',
    transactionPrice: '',
    fairValue: '',
    numberOfShares: '',
    buyerType: '',
    entityInvolvement: '',
    economicInterest: '',
    sellerType: '',
    shareStatus: '',
    monthsHeld: '',
    previouslyCost: '',
    isShortTermInducement: '',
    hasPattern: '',
    contingentEvent: ''
  });

  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('input');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const analyzeTransaction = () => {
    const price = parseFloat(inputs.transactionPrice) || 0;
    const fv = parseFloat(inputs.fairValue) || 0;
    const shares = parseFloat(inputs.numberOfShares) || 0;
    const prevCost = parseFloat(inputs.previouslyCost) || 0;
    const monthsHeld = parseFloat(inputs.monthsHeld) || 0;

    const excessOverFV = Math.max(0, price - fv);
    const totalExcess = excessOverFV * shares;
    const isImmature = monthsHeld < 6 && inputs.shareStatus !== 'mature';

    let isCompensatory = false;
    let compensationAmount = 0;
    let reasoning = [];
    let requiresReclassification = false;
    let reclassificationReason = '';
    let journalEntries = [];
    let accountingTreatment = '';

    if (inputs.sellerType === 'investor') {
      reasoning.push({
        step: 'Seller Type Analysis',
        conclusion: 'Seller is an investor (non-employee) - transaction generally treated as capital/distribution transaction',
        isAlert: false
      });

      if (price > fv) {
        reasoning.push({
          step: 'Transaction Price Analysis',
          conclusion: `Transaction price ($${price.toFixed(2)}) exceeds fair value ($${fv.toFixed(2)}) by $${excessOverFV.toFixed(2)} per share`,
          isAlert: true
        });

        if (inputs.buyerType === 'entity') {
          accountingTreatment = 'distribution';
          reasoning.push({
            step: 'Entity Repurchase from Investor',
            conclusion: 'Excess represents a distribution to shareholder, not compensation. Record as distribution/dividend.',
            isAlert: false
          });

          journalEntries.push({
            account: 'Dr. Treasury Stock (or Equity)',
            amount: fv * shares
          });
          journalEntries.push({
            account: 'Dr. Retained Earnings (Distribution)',
            amount: totalExcess
          });
          journalEntries.push({
            account: 'Cr. Cash',
            amount: price * shares
          });
        } else {
          accountingTreatment = 'capital_transaction';
          reasoning.push({
            step: 'Third-Party Purchase from Investor',
            conclusion: 'Transaction between shareholders - generally no accounting impact for the entity',
            isAlert: false
          });
        }
      } else {
        accountingTreatment = 'no_impact';
        reasoning.push({
          step: 'Transaction at or Below Fair Value',
          conclusion: 'Transaction at fair value - no compensation or distribution issues',
          isAlert: false
        });
      }
    } else {
      if (price > fv) {
        reasoning.push({
          step: 'Transaction Price Analysis',
          conclusion: `Transaction price ($${price.toFixed(2)}) exceeds fair value ($${fv.toFixed(2)}) by $${excessOverFV.toFixed(2)} per share`,
          isAlert: true
        });

        if (inputs.buyerType === 'entity') {
          isCompensatory = true;
          compensationAmount = totalExcess;
          accountingTreatment = 'compensation';
          reasoning.push({
            step: 'Direct Entity Repurchase',
            conclusion: 'Per ASC 718-20-35-7, excess of repurchase price over fair value must be recognized as compensation cost',
            isAlert: true
          });

          journalEntries.push({
            account: 'Dr. Additional Paid-in Capital',
            amount: fv * shares
          });
          journalEntries.push({
            account: 'Dr. Compensation Cost',
            amount: totalExcess
          });
          journalEntries.push({
            account: 'Cr. Cash',
            amount: price * shares
          });
        } else if (inputs.buyerType === 'related_party' || inputs.buyerType === 'economic_holder') {
          if (inputs.economicInterest === 'de_minimis') {
            reasoning.push({
              step: 'Economic Interest Assessment',
              conclusion: 'Buyer has de minimis economic interest - presumption may be overcome',
              isAlert: false
            });
            
            if (inputs.entityInvolvement === 'facilitated') {
              isCompensatory = true;
              compensationAmount = totalExcess;
              accountingTreatment = 'compensation';
              reasoning.push({
                step: 'Entity Involvement',
                conclusion: 'Entity facilitated the transaction - excess is compensatory',
                isAlert: true
              });
            } else {
              accountingTreatment = 'non_compensatory';
            }
          } else {
            isCompensatory = true;
            compensationAmount = totalExcess;
            accountingTreatment = 'compensation';
            reasoning.push({
              step: 'Related Party Transaction',
              conclusion: 'Per ASC 718-10-15-4, transaction with related party/economic interest holder presumed compensatory',
              isAlert: true
            });

            journalEntries.push({
              account: 'Dr. Compensation Cost',
              amount: totalExcess
            });
            journalEntries.push({
              account: 'Cr. Additional Paid-in Capital (Capital Contribution)',
              amount: totalExcess
            });
          }
        } else if (inputs.buyerType === 'new_investor') {
          if (inputs.entityInvolvement === 'facilitated') {
            isCompensatory = true;
            compensationAmount = totalExcess;
            accountingTreatment = 'compensation';
            reasoning.push({
              step: 'Entity Facilitation',
              conclusion: 'Entity facilitated transaction with new investor - excess is compensatory',
              isAlert: true
            });

            journalEntries.push({
              account: 'Dr. Compensation Cost',
              amount: totalExcess
            });
            journalEntries.push({
              account: 'Cr. Additional Paid-in Capital (Capital Contribution)',
              amount: totalExcess
            });
          } else if (inputs.entityInvolvement === 'minimal') {
            accountingTreatment = 'non_compensatory';
            reasoning.push({
              step: 'Minimal Entity Involvement',
              conclusion: 'Only protective rights exercised (e.g., right of first refusal waived) - generally non-compensatory',
              isAlert: false
            });
          }
        }
      } else {
        accountingTreatment = 'no_excess';
        reasoning.push({
          step: 'Transaction Price Analysis',
          conclusion: 'Transaction price does not exceed fair value - no compensation cost for excess',
          isAlert: false
        });
      }

      if (isImmature && inputs.shareStatus === 'immature') {
        reasoning.push({
          step: 'Share Maturity Assessment',
          conclusion: `Shares held for ${monthsHeld} months (less than 6) - considered immature shares`,
          isAlert: true
        });

        if (inputs.isShortTermInducement === 'yes') {
          reasoning.push({
            step: 'Short-Term Inducement',
            conclusion: 'Transaction qualifies as short-term inducement - no reclassification required',
            isAlert: false
          });
        } else if (inputs.hasPattern === 'yes') {
          requiresReclassification = true;
          reclassificationReason = 'Pattern of repurchasing immature shares established - substantive liability exists';
          
          reasoning.push({
            step: 'Pattern of Repurchase',
            conclusion: 'Entity has established pattern of repurchasing immature shares - requires liability classification',
            isAlert: true
          });

          const reclassAmount = price * shares;
          const additionalCompCost = Math.max(0, reclassAmount - (prevCost * shares));

          journalEntries.push({
            section: 'Reclassification Entry',
            account: 'Dr. Compensation Cost',
            amount: additionalCompCost
          });
          journalEntries.push({
            account: 'Dr. Additional Paid-in Capital',
            amount: prevCost * shares
          });
          journalEntries.push({
            account: 'Cr. Share-Based Payment Liability',
            amount: reclassAmount
          });
        } else if (inputs.contingentEvent === 'probable') {
          requiresReclassification = true;
          reclassificationReason = 'Contingent repurchase event is probable - contingent liability exists';
          
          reasoning.push({
            step: 'Contingent Repurchase',
            conclusion: 'Contingent event triggering repurchase is probable - liability classification required',
            isAlert: true
          });
        }
      }
    }

    setAnalysis({
      isCompensatory,
      compensationAmount,
      excessPerShare: excessOverFV,
      totalTransactionValue: price * shares,
      reasoning,
      requiresReclassification,
      reclassificationReason,
      journalEntries,
      isImmature,
      accountingTreatment
    });

    setActiveTab('results');
  };

  const generateMemo = () => {
    if (!analysis) return '';

    const date = inputs.transactionDate || new Date().toLocaleDateString();
    const company = inputs.companyName || '[Company Name]';

    return `ACCOUNTING MEMORANDUM

TO:       Files
FROM:     Technical Accounting Department
DATE:     ${date}
RE:       Secondary Market Transaction - ASC 718 Analysis

=================================================================

BACKGROUND

${company} executed a secondary market transaction on ${date} involving the ${inputs.sellerType === 'investor' ? 'sale of shares by an investor' : 'repurchase of employee shares'}. The transaction details are as follows:

- Transaction Price per Share:    $${parseFloat(inputs.transactionPrice).toFixed(2)}
- Fair Value per Share:            $${parseFloat(inputs.fairValue).toFixed(2)}
- Number of Shares:                ${parseFloat(inputs.numberOfShares).toLocaleString()}
- Total Transaction Value:         $${analysis.totalTransactionValue.toFixed(2)}
- Buyer Type:                      ${inputs.buyerType.replace(/_/g, ' ')}
- Seller Type:                     ${inputs.sellerType.replace(/_/g, ' ')}
${inputs.shareStatus === 'immature' ? `• Share Status:                    Immature (${inputs.monthsHeld} months held)` : ''}

ANALYSIS

Price vs. Fair Value Assessment:
${analysis.excessPerShare > 0 ? 
  `The transaction price of $${parseFloat(inputs.transactionPrice).toFixed(2)} exceeds the fair value of $${parseFloat(inputs.fairValue).toFixed(2)} by $${analysis.excessPerShare.toFixed(2)} per share, resulting in a total excess of $${(analysis.excessPerShare * parseFloat(inputs.numberOfShares)).toFixed(2)}.` :
  `The transaction was executed at or below fair value with no excess consideration.`}

${inputs.sellerType === 'investor' ? 
`Investor Seller Treatment:
As the seller is an investor (non-employee shareholder), this transaction is not subject to ASC 718 share-based payment guidance. The accounting treatment depends on whether the entity is directly involved in the repurchase:

${inputs.buyerType === 'entity' ? 
  '• Entity is directly repurchasing shares: Any excess over fair value represents a distribution to the shareholder and should be recorded as a distribution/dividend rather than compensation expense.' :
  '• Third-party purchase: This is a transaction between shareholders with generally no accounting impact for the entity unless the entity provided consideration or facilitated the transaction in a manner that creates a liability.'}` :
`Employee/Founder Seller Treatment:
${analysis.reasoning.map(r => `• ${r.step}: ${r.conclusion}`).join('\n')}

${analysis.isCompensatory ? 
`COMPENSATORY CONCLUSION:
Based on the analysis above, we conclude that the excess consideration of $${analysis.compensationAmount.toFixed(2)} represents compensation cost that must be recognized under ASC 718-20-35-7.` :
`NON-COMPENSATORY CONCLUSION:
Based on the facts and circumstances, particularly ${inputs.entityInvolvement === 'minimal' ? 'the minimal entity involvement' : 'the nature of the transaction'}, we conclude that this transaction does not result in incremental compensation cost.`}`}

${analysis.requiresReclassification ? `
CLASSIFICATION ASSESSMENT:
${analysis.reclassificationReason}

Per ASC 718-10-25-15, the accounting for share-based payment awards must reflect both written terms and substantive terms established by past practice. The entity must reclassify affected awards from equity to liability classification and remeasure them at fair value at each reporting period.` : ''}

JOURNAL ENTRIES
${analysis.journalEntries.length > 0 ?
  analysis.journalEntries.map(e => 
    `${e.section ? `\n${e.section}\n` : ''}${e.account.padEnd(50)} $${e.amount.toFixed(2).padStart(12)}`
  ).join('\n') :
  'No journal entries required for this transaction.'}

CONCLUSION

${analysis.isCompensatory ? 
  `The Company should recognize $${analysis.compensationAmount.toFixed(2)} of compensation cost related to this secondary market transaction.` :
  inputs.sellerType === 'investor' && analysis.accountingTreatment === 'distribution' ?
  `The Company should record the excess as a distribution to shareholders rather than compensation expense.` :
  `No incremental compensation cost should be recognized for this transaction.`}

${analysis.requiresReclassification ?
  `Additionally, the Company must reclassify the affected awards from equity to liability classification and establish appropriate procedures for ongoing fair value remeasurement.` : ''}

AUTHORITATIVE REFERENCES

- ASC 718-10-15-4: Share-Based Payment Arrangements—Determining Whether an Arrangement Is Subject to This Topic
- ASC 718-20-35-7: Awards Classified as Equity—Subsequent Measurement
- ASC 718-10-25-15: Recognition—Effect of the Past Practice
${inputs.sellerType !== 'investor' ? '• ASC 505-30-30-2 through 30-4: Equity—Treasury Stock' : ''}

This conclusion is based on the facts and circumstances as understood at the date of this memorandum. Changes in facts or circumstances may require reassessment.

=================================================================
Technical Accounting Department
${company}`;
  };

  const downloadMemo = () => {
    const memo = generateMemo();
    const blob = new Blob([memo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Secondary_Market_Transaction_Memo_${inputs.transactionDate || 'draft'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderFlowchart = () => (
    <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
      <h3 style={{ marginTop: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <GitBranch size={20} />
        ASC 718 Decision Flowchart
      </h3>
      
      <svg width="100%" height="900" viewBox="0 0 800 900" style={{ maxWidth: '800px', margin: '0 auto', display: 'block' }}>
        <rect x="250" y="10" width="300" height="60" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="2" rx="5"/>
        <text x="400" y="45" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
          Secondary Market Transaction
        </text>
        
        <line x1="400" y1="70" x2="400" y2="100" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        <path d="M 400 100 L 500 150 L 400 200 L 300 150 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2"/>
        <text x="400" y="145" textAnchor="middle" fontSize="14" fontWeight="bold">Is seller an</text>
        <text x="400" y="165" textAnchor="middle" fontSize="14" fontWeight="bold">investor?</text>
        
        <line x1="500" y1="150" x2="650" y2="150" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="560" y="145" fontSize="12" fill="#16a34a" fontWeight="bold">YES</text>
        
        <rect x="650" y="120" width="130" height="60" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" rx="5"/>
        <text x="715" y="145" textAnchor="middle" fontSize="12">Capital/Distribution</text>
        <text x="715" y="165" textAnchor="middle" fontSize="12">Transaction</text>
        
        <line x1="400" y1="200" x2="400" y2="230" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="420" y="220" fontSize="12" fill="#dc2626" fontWeight="bold">NO</text>
        
        <path d="M 400 230 L 500 280 L 400 330 L 300 280 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2"/>
        <text x="400" y="275" textAnchor="middle" fontSize="13" fontWeight="bold">Transaction Price</text>
        <text x="400" y="295" textAnchor="middle" fontSize="13" fontWeight="bold">&gt; Fair Value?</text>
        
        <line x1="300" y1="280" x2="150" y2="280" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="240" y="275" fontSize="12" fill="#16a34a" fontWeight="bold">NO</text>
        
        <rect x="20" y="250" width="130" height="60" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" rx="5"/>
        <text x="85" y="275" textAnchor="middle" fontSize="12">No Compensation</text>
        <text x="85" y="295" textAnchor="middle" fontSize="12">Cost</text>
        
        <line x1="400" y1="330" x2="400" y2="360" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="420" y="350" fontSize="12" fill="#dc2626" fontWeight="bold">YES</text>
        
        <path d="M 400 360 L 500 410 L 400 460 L 300 410 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2"/>
        <text x="400" y="405" textAnchor="middle" fontSize="13" fontWeight="bold">Direct Entity</text>
        <text x="400" y="425" textAnchor="middle" fontSize="13" fontWeight="bold">Repurchase?</text>
        
        <line x1="500" y1="410" x2="650" y2="410" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="560" y="405" fontSize="12" fill="#dc2626" fontWeight="bold">YES</text>
        
        <rect x="650" y="380" width="130" height="60" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" rx="5"/>
        <text x="715" y="405" textAnchor="middle" fontSize="11" fontWeight="bold">COMPENSATORY</text>
        <text x="715" y="425" textAnchor="middle" fontSize="11">ASC 718-20-35-7</text>
        
        <line x1="400" y1="460" x2="400" y2="490" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="420" y="480" fontSize="12" fill="#16a34a" fontWeight="bold">NO</text>
        
        <path d="M 400 490 L 500 540 L 400 590 L 300 540 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2"/>
        <text x="400" y="530" textAnchor="middle" fontSize="12" fontWeight="bold">Related Party or</text>
        <text x="400" y="545" textAnchor="middle" fontSize="12" fontWeight="bold">Economic Interest</text>
        <text x="400" y="560" textAnchor="middle" fontSize="12" fontWeight="bold">Holder?</text>
        
        <line x1="300" y1="540" x2="200" y2="540" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="260" y="535" fontSize="12" fill="#16a34a" fontWeight="bold">NO</text>
        
        <line x1="200" y1="540" x2="200" y2="640" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        <line x1="500" y1="540" x2="600" y2="540" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="540" y="535" fontSize="12" fill="#dc2626" fontWeight="bold">YES</text>
        
        <path d="M 600 540 L 680 580 L 600 620 L 520 580 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2"/>
        <text x="600" y="575" textAnchor="middle" fontSize="11" fontWeight="bold">De Minimis</text>
        <text x="600" y="590" textAnchor="middle" fontSize="11" fontWeight="bold">Interest?</text>
        
        <line x1="680" y1="580" x2="750" y2="580" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="705" y="575" fontSize="11" fill="#dc2626" fontWeight="bold">NO</text>
        
        <rect x="750" y="555" width="40" height="50" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" rx="3"/>
        <text x="770" y="575" textAnchor="middle" fontSize="9" fontWeight="bold">COMP</text>
        <text x="770" y="590" textAnchor="middle" fontSize="9">ASC</text>
        <text x="770" y="600" textAnchor="middle" fontSize="9">718-10</text>
        
        <line x1="600" y1="620" x2="600" y2="640" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="620" y="635" fontSize="11" fill="#16a34a" fontWeight="bold">YES</text>
        
        <line x1="600" y1="640" x2="200" y2="640" stroke="#1e3a8a" strokeWidth="2"/>
        
        <path d="M 200 640 L 300 690 L 200 740 L 100 690 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2"/>
        <text x="200" y="685" textAnchor="middle" fontSize="12" fontWeight="bold">Entity Facilitated</text>
        <text x="200" y="705" textAnchor="middle" fontSize="12" fontWeight="bold">Transaction?</text>
        
        <line x1="300" y1="690" x2="400" y2="690" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="335" y="685" fontSize="11" fill="#dc2626" fontWeight="bold">YES</text>
        
        <rect x="400" y="665" width="130" height="50" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" rx="5"/>
        <text x="465" y="687" textAnchor="middle" fontSize="11" fontWeight="bold">COMPENSATORY</text>
        <text x="465" y="702" textAnchor="middle" fontSize="10">Recognize Excess</text>
        
        <line x1="100" y1="690" x2="50" y2="690" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <text x="85" y="685" fontSize="11" fill="#16a34a" fontWeight="bold">NO</text>
        
        <rect x="10" y="665" width="40" height="50" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" rx="3"/>
        <text x="30" y="685" textAnchor="middle" fontSize="8" fontWeight="bold">NON-</text>
        <text x="30" y="695" textAnchor="middle" fontSize="8" fontWeight="bold">COMP</text>
        
        <line x1="200" y1="740" x2="200" y2="780" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        <rect x="130" y="780" width="140" height="40" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" rx="5"/>
        <text x="200" y="805" textAnchor="middle" fontSize="11" fontWeight="bold">Immature Shares?</text>
        
        <line x1="200" y1="820" x2="200" y2="850" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        <rect x="100" y="850" width="200" height="40" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" rx="5"/>
        <text x="200" y="875" textAnchor="middle" fontSize="10" fontWeight="bold">Classification Assessment Required</text>
        
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#1e3a8a" />
          </marker>
        </defs>
      </svg>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '5px', fontSize: '0.85rem', color: '#475569' }}>
        <strong>Legend:</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', background: '#fbbf24', border: '1px solid #92400e' }}></div>
            <span>Decision Point</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', background: '#fee2e2', border: '1px solid #dc2626' }}></div>
            <span>Compensatory</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', background: '#dcfce7', border: '1px solid #16a34a' }}></div>
            <span>Non-Compensatory</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDecisionTree = () => (
    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
      <h3 style={{ marginTop: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Info size={20} />
        ASC 718 Decision Framework
      </h3>
      <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.8' }}>
        <p><strong>1. Identify the seller type:</strong></p>
        <ul>
          <li>If INVESTOR → Capital/distribution transaction (not ASC 718)</li>
          <li>If EMPLOYEE/FOUNDER → Proceed to compensation analysis</li>
        </ul>
        
        <p><strong>2. Is transaction price in excess of fair value?</strong></p>
        <ul>
          <li>If NO → Generally no compensation cost</li>
          <li>If YES → Proceed to next step</li>
        </ul>
        
        <p><strong>3. Is purchase executed by the entity?</strong></p>
        <ul>
          <li>If YES → Recognize excess as compensation (ASC 718-20-35-7)</li>
          <li>If NO → Proceed to next step</li>
        </ul>
        
        <p><strong>4. Is purchase by related party or economic interest holder?</strong></p>
        <ul>
          <li>If YES and interest is NOT de minimis → Compensatory</li>
          <li>If interest is de minimis → Proceed to next step</li>
        </ul>
        
        <p><strong>5. Is entity involved in the transaction?</strong></p>
        <ul>
          <li>Facilitation includes: connecting buyers/sellers, negotiating price, providing non-public info</li>
          <li>If involved → Presumed compensatory unless clearly for other purposes</li>
        </ul>
        
        <p><strong>6. Immature shares consideration (regardless of price):</strong></p>
        <ul>
          <li>Shares held &lt;6 months are immature</li>
          <li>Pattern of repurchase → Substantive liability</li>
          <li>Contingent repurchase when probable → Contingent liability</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', padding: '30px', borderRadius: '10px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>Secondary Market Transaction Analysis</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>ASC 718 Compensation Cost & Classification Assessment Tool</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('input')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'input' ? '#3b82f6' : 'transparent',
            color: activeTab === 'input' ? 'white' : '#64748b',
            border: 'none',
            borderBottom: activeTab === 'input' ? '3px solid #1e3a8a' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          Input & Analysis
        </button>
        <button
          onClick={() => setActiveTab('flowchart')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'flowchart' ? '#3b82f6' : 'transparent',
            color: activeTab === 'flowchart' ? 'white' : '#64748b',
            border: 'none',
            borderBottom: activeTab === 'flowchart' ? '3px solid #1e3a8a' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          Flowchart
        </button>
        <button
          onClick={() => setActiveTab('memo')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'memo' ? '#3b82f6' : 'transparent',
            color: activeTab === 'memo' ? 'white' : '#64748b',
            border: 'none',
            borderBottom: activeTab === 'memo' ? '3px solid #1e3a8a' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <FileText size={16} />
          Accounting Memo
        </button>
      </div>

      {activeTab === 'flowchart' && renderFlowchart()}

      {activeTab === 'memo' && (
        <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.5rem' }}>Accounting Memorandum</h2>
            {analysis && (
              <button
                onClick={downloadMemo}
                style={{
                  padding: '10px 20px',
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 'bold'
                }}
              >
                <Download size={16} />
                Download Memo
              </button>
            )}
          </div>
          
          {analysis ? (
            <pre style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '5px',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              maxHeight: '700px',
              overflow: 'auto',
              border: '1px solid #e2e8f0'
            }}>
              {generateMemo()}
            </pre>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <FileText size={48} style={{ marginBottom: '20px', opacity: 0.5 }} />
              <p>Complete the analysis first to generate the accounting memorandum</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'input' && (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', gap: '30px' }}>
          {/* Input Section */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, color: '#1e3a8a', fontSize: '1.5rem' }}>Transaction Details</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={inputs.companyName}
                onChange={handleInputChange}
                placeholder="e.g., ABC Corporation"
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                Transaction Date
              </label>
              <input
                type="date"
                name="transactionDate"
                value={inputs.transactionDate}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                Transaction Price per Share ($)
              </label>
              <input
                type="number"
                step="0.01"
                name="transactionPrice"
                value={inputs.transactionPrice}
                onChange={handleInputChange}
                placeholder="e.g., 15.00"
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                Fair Value per Share ($)
              </label>
              <input
                type="number"
                step="0.01"
                name="fairValue"
                value={inputs.fairValue}
                onChange={handleInputChange}
                placeholder="e.g., 10.00"
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                Number of Shares
              </label>
              <input
                type="number"
                name="numberOfShares"
                value={inputs.numberOfShares}
                onChange={handleInputChange}
                placeholder="e.g., 1000"
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                Seller Type
              </label>
              <select
                name="sellerType"
                value={inputs.sellerType}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Select...</option>
                <option value="current_employee">Current Employee</option>
                <option value="former_employee">Former Employee</option>
                <option value="founder">Founder</option>
                <option value="executive">Executive/Senior Management</option>
                <option value="investor">Investor (Non-Employee Shareholder)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                Buyer Type
              </label>
              <select
                name="buyerType"
                value={inputs.buyerType}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Select...</option>
                <option value="entity">Entity (Direct Repurchase)</option>
                <option value="related_party">Related Party</option>
                <option value="economic_holder">Economic Interest Holder</option>
                <option value="new_investor">New Investor</option>
              </select>
            </div>

            {(inputs.buyerType === 'economic_holder' || inputs.buyerType === 'related_party') && inputs.sellerType !== 'investor' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                  Economic Interest Level
                </label>
                <select
                  name="economicInterest"
                  value={inputs.economicInterest}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select...</option>
                  <option value="de_minimis">De Minimis (&lt;1-2%, no board seat)</option>
                  <option value="significant">Significant (≥3% or board influence)</option>
                </select>
              </div>
            )}

            {inputs.sellerType !== 'investor' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                  Entity Involvement Level
                </label>
                <select
                  name="entityInvolvement"
                  value={inputs.entityInvolvement}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select...</option>
                  <option value="facilitated">Facilitated (Connected parties, negotiated price, provided info)</option>
                  <option value="minimal">Minimal (Only waived right of first refusal)</option>
                  <option value="none">None</option>
                </select>
              </div>
            )}

            {inputs.sellerType{inputs.shareStatus === 'immature' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                    Months Held Since Vest/Exercise
                  </label>
                  <input
                    type="number"
                    name="monthsHeld"
                    value={inputs.monthsHeld}
                    onChange={handleInputChange}
                    placeholder="e.g., 3"
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                    Previously Recognized Compensation Cost per Share ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="previouslyCost"
                    value={inputs.previouslyCost}
                    onChange={handleInputChange}
                    placeholder="e.g., 4.00"
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                    Qualifies as Short-Term Inducement?
                  </label>
                  <select
                    name="isShortTermInducement"
                    value={inputs.isShortTermInducement}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes (Limited offer period, first occurrence)</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {inputs.isShortTermInducement === 'no' && (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                        Pattern of Repurchasing Immature Shares?
                      </label>
                      <select
                        name="hasPattern"
                        value={inputs.hasPattern}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes (Multiple prior repurchases)</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>
                        Contingent Repurchase Event Status
                      </label>
                      <select
                        name="contingentEvent"
                        value={inputs.contingentEvent}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="">Select...</option>
                        <option value="probable">Probable (e.g., financing round closed)</option>
                        <option value="not_probable">Not Probable</option>
                        <option value="na">Not Applicable</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        <button
          onClick={analyzeTransaction}
          style={{
            width: '100%',
            padding: '15px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Analyze Transaction
        </button>
      </div>

      {/* Results Section */}
      <div>
        <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, color: '#1e3a8a', fontSize: '1.5rem' }}>Analysis Results</h2>
          
          {analysis ? (
            <>
              <div style={{
                background: analysis.isCompensatory ? '#fee2e2' : inputs.sellerType === 'investor' ? '#dbeafe' : '#dcfce7',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: `2px solid ${analysis.isCompensatory ? '#dc2626' : inputs.sellerType === 'investor' ? '#3b82f6' : '#16a34a'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {analysis.isCompensatory ? (
                    <AlertCircle size={24} color="#dc2626" />
                  ) : inputs.sellerType === 'investor' ? (
                    <Info size={24} color="#3b82f6" />
                  ) : (
                    <CheckCircle size={24} color="#16a34a" />
                  )}
                  <h3 style={{ margin: 0, color: analysis.isCompensatory ? '#dc2626' : inputs.sellerType === 'investor' ? '#1e3a8a' : '#16a34a' }}>
                    {analysis.isCompensatory ? 'COMPENSATORY TRANSACTION' : 
                     inputs.sellerType === 'investor' ? 'INVESTOR TRANSACTION' : 
                     'NON-COMPENSATORY TRANSACTION'}
                  </h3>
                </div>
                {analysis.isCompensatory && (
                  <>
                    <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '5px' }}>
                      Compensation Cost to Recognize:
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                      ${analysis.compensationAmount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '5px' }}>
                      Excess over FV: ${analysis.excessPerShare.toFixed(2)} per share
                    </div>
                  </>
                )}
                {inputs.sellerType === 'investor' && (
                  <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '10px' }}>
                    This is a capital/distribution transaction, not subject to ASC 718 compensation accounting.
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#1e3a8a', fontSize: '1.2rem' }}>Transaction Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '5px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Value</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#334155' }}>
                      ${analysis.totalTransactionValue.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '5px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Excess/Share</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#334155' }}>
                      ${analysis.excessPerShare.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#1e3a8a', fontSize: '1.2rem' }}>Analysis Steps</h3>
                {analysis.reasoning.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '15px',
                      background: step.isAlert ? '#fef3c7' : '#f1f5f9',
                      borderRadius: '5px',
                      marginBottom: '10px',
                      borderLeft: `4px solid ${step.isAlert ? '#f59e0b' : '#64748b'}`
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
                      {step.step}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                      {step.conclusion}
                    </div>
                  </div>
                ))}
              </div>

              {analysis.requiresReclassification && (
                <div style={{
                  padding: '15px',
                  background: '#fee2e2',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '2px solid #dc2626'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <AlertCircle size={20} color="#dc2626" />
                    <h3 style={{ margin: 0, color: '#dc2626' }}>Classification Change Required</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                    {analysis.reclassificationReason}
                  </p>
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                    Awards must be reclassified from equity to liability and remeasured at fair value each period.
                  </p>
                </div>
              )}

              {analysis.journalEntries.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#1e3a8a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={20} />
                    Journal Entries
                  </h3>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '5px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {analysis.journalEntries.map((entry, idx) => (
                      <div key={idx} style={{ marginBottom: entry.section ? '15px' : '5px' }}>
                        {entry.section && (
                          <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px', fontFamily: 'Arial' }}>
                            {entry.section}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                          <span>{entry.account}</span>
                          <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>${entry.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <FileText size={48} style={{ marginBottom: '20px', opacity: 0.5 }} />
              <p>Complete the transaction details and click "Analyze Transaction" to see results</p>
            </div>
          )}
        </div>

        {renderDecisionTree()}
      </div>
    </div>
  )}

  <div style={{ marginTop: '30px', background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
    <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>Key Considerations</h3>
    <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.8' }}>
      <p><strong>Seller Type Considerations:</strong></p>
      <ul>
        <li><strong>Employees/Founders:</strong> Subject to ASC 718 analysis; excess over FV may be compensatory</li>
        <li><strong>Investors:</strong> Not subject to ASC 718; treated as capital/distribution transactions</li>
      </ul>

      <p><strong>Entity Facilitation Indicators:</strong></p>
      <ul>
        <li>Connecting buyers and sellers or providing shareholder lists</li>
        <li>Determining which buyers/sellers can participate</li>
        <li>Dictating number of shares that can be sold</li>
        <li>Negotiating or suggesting a price</li>
        <li>Agreeing to change share rights</li>
        <li>Providing non-publicly available information</li>
      </ul>

      <p><strong>Immature Shares (ASC 718-10-25-9):</strong></p>
      <ul>
        <li>Shares held less than 6 months from vesting (shares) or exercise (options)</li>
        <li>Options are never considered mature</li>
        <li>Repurchase requires classification assessment</li>
      </ul>
    </div>
  </div>

  <div style={{ marginTop: '20px', background: '#fffbeb', padding: '20px', borderRadius: '10px', border: '1px solid #fbbf24' }}>
    <h4 style={{ marginTop: 0, color: '#92400e', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Info size={20} />
      Disclosure Considerations
    </h4>
    <div style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: '1.6' }}>
      <p>Entities must consider disclosure requirements under:</p>
      <ul style={{ marginBottom: 0 }}>
        <li><strong>ASC 718:</strong> Stock compensation disclosures</li>
        <li><strong>ASC 850:</strong> Related party disclosures</li>
        <li><strong>SEC Requirements:</strong> For IPO/SPAC registration statements</li>
      </ul>
    </div>
  </div>

  <div style={{ marginTop: '20px', padding: '15px', background: '#f1f5f9', borderRadius: '5px', fontSize: '0.85rem', color: '#475569', textAlign: 'center' }}>
    © 2024 PrimeBooks Consulting LLC | This tool is for educational and analytical purposes. Consult with qualified accounting professionals for specific guidance.
  </div>
</div>---

## 9. `README.md`
````markdown
# Secondary Market Transaction Analyzer

Professional ASC 718 compliance tool for analyzing secondary market transactions and calculating compensation expense.

![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Features

- ✅ Complete ASC 718 decision tree analysis
- ✅ Visual flowchart of decision framework
- ✅ Automated compensation cost calculation
- ✅ Classification assessment for immature shares
- ✅ Professional accounting memo generation
- ✅ Support for investor vs. employee seller scenarios
- ✅ Journal entry recommendations
- ✅ Downloadable documentation

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Charts:** Recharts
- **Icons:** Lucide React
- **Styling:** Inline styles (no build dependencies)
- **Deployment:** Optimized for Vercel

## 🛠️ Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/secondary-market-analyzer.git
cd secondary-market-analyzer

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure
````
secondary-market-analyzer/
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles
├── components/
│   └── SecondaryMarketCalculator.jsx  # Main component
├── public/                # Static assets
├── .gitignore
├── package.json
├── next.config.mjs
└── README.md
              
