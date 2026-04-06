'use client';

import { useState, useCallback } from 'react';
import styles from './ScientificCalculator.module.css';

type AngleMode = 'DEG' | 'RAD';

interface CalculatorState {
  display: string;
  expression: string;
  justEvaluated: boolean;
  angleMode: AngleMode;
  memory: number;
  history: string[];
}

const initialState: CalculatorState = {
  display: '0',
  expression: '',
  justEvaluated: false,
  angleMode: 'DEG',
  memory: 0,
  history: []
};

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function evaluate(expr: string, angleMode: AngleMode): number {
  let processed = expr
    .replace(/sin\(([^)]+)\)/g, (_, arg) => {
      const val = parseFloat(arg);
      return String(Math.sin(angleMode === 'DEG' ? toRad(val) : val));
    })
    .replace(/cos\(([^)]+)\)/g, (_, arg) => {
      const val = parseFloat(arg);
      return String(Math.cos(angleMode === 'DEG' ? toRad(val) : val));
    })
    .replace(/tan\(([^)]+)\)/g, (_, arg) => {
      const val = parseFloat(arg);
      return String(Math.tan(angleMode === 'DEG' ? toRad(val) : val));
    })
    .replace(/asin\(([^)]+)\)/g, (_, arg) => {
      const val = parseFloat(arg);
      const result = Math.asin(val);
      return String(angleMode === 'DEG' ? (result * 180) / Math.PI : result);
    })
    .replace(/acos\(([^)]+)\)/g, (_, arg) => {
      const val = parseFloat(arg);
      const result = Math.acos(val);
      return String(angleMode === 'DEG' ? (result * 180) / Math.PI : result);
    })
    .replace(/atan\(([^)]+)\)/g, (_, arg) => {
      const val = parseFloat(arg);
      const result = Math.atan(val);
      return String(angleMode === 'DEG' ? (result * 180) / Math.PI : result);
    })
    .replace(/log\(([^)]+)\)/g, (_, arg) => String(Math.log10(parseFloat(arg))))
    .replace(/ln\(([^)]+)\)/g, (_, arg) => String(Math.log(parseFloat(arg))))
    .replace(/sqrt\(([^)]+)\)/g, (_, arg) => String(Math.sqrt(parseFloat(arg))))
    .replace(/cbrt\(([^)]+)\)/g, (_, arg) => String(Math.cbrt(parseFloat(arg))))
    .replace(/abs\(([^)]+)\)/g, (_, arg) => String(Math.abs(parseFloat(arg))))
    .replace(/exp\(([^)]+)\)/g, (_, arg) => String(Math.exp(parseFloat(arg))));

  processed = processed.replace(/\^/g, '**');
  processed = processed.replace(/\u03c0/g, String(Math.PI)).replace(/\be\b/g, String(Math.E));

  // eslint-disable-next-line no-new-func
  const result = Function('"use strict"; return (' + processed + ')')();
  return result;
}

export default function ScientificCalculator() {
  const [state, setState] = useState<CalculatorState>(initialState);
  const [showHistory, setShowHistory] = useState(false);

  const handleNumber = useCallback((num: string) => {
    setState(prev => {
      if (prev.justEvaluated) {
        return { ...prev, display: num, expression: num, justEvaluated: false };
      }
      const newDisplay = prev.display === '0' ? num : prev.display + num;
      return { ...prev, display: newDisplay, expression: prev.expression + num };
    });
  }, []);

  const handleDecimal = useCallback(() => {
    setState(prev => {
      if (prev.justEvaluated) {
        return { ...prev, display: '0.', expression: '0.', justEvaluated: false };
      }
      if (prev.display.includes('.')) return prev;
      const newDisplay = prev.display + '.';
      return { ...prev, display: newDisplay, expression: prev.expression + '.' };
    });
  }, []);

  const handleOperator = useCallback((op: string) => {
    setState(prev => {
      const newExpr = prev.justEvaluated
        ? prev.display + op
        : prev.expression + op;
      return {
        ...prev,
        expression: newExpr,
        display: op,
        justEvaluated: false
      };
    });
  }, []);

  const handleFunction = useCallback((fn: string) => {
    setState(prev => {
      const newExpr = prev.justEvaluated
        ? fn + '(' + prev.display + ')'
        : prev.expression + fn + '(';
      const newDisplay = fn + '(';
      return {
        ...prev,
        expression: newExpr,
        display: newDisplay,
        justEvaluated: false
      };
    });
  }, []);

  const handleConstant = useCallback((constant: string, value: string) => {
    setState(prev => {
      if (prev.justEvaluated) {
        return { ...prev, display: value, expression: constant, justEvaluated: false };
      }
      return {
        ...prev,
        display: value,
        expression: prev.expression + constant,
        justEvaluated: false
      };
    });
  }, []);

  const handleEquals = useCallback(() => {
    setState(prev => {
      if (!prev.expression) return prev;
      try {
        const result = evaluate(prev.expression, prev.angleMode);
        const resultStr = Number.isFinite(result)
          ? parseFloat(result.toPrecision(12)).toString()
          : 'Error';
        const historyEntry = prev.expression + ' = ' + resultStr;
        return {
          ...prev,
          display: resultStr,
          expression: resultStr,
          justEvaluated: true,
          history: [historyEntry, ...prev.history].slice(0, 20)
        };
      } catch {
        return { ...prev, display: 'Error', expression: '', justEvaluated: true };
      }
    });
  }, []);

  const handleClear = useCallback(() => {
    setState(prev => ({ ...prev, display: '0', expression: '', justEvaluated: false }));
  }, []);

  const handleAllClear = useCallback(() => {
    setState(prev => ({ ...initialState, angleMode: prev.angleMode, memory: prev.memory, history: prev.history }));
  }, []);

  const handleBackspace = useCallback(() => {
    setState(prev => {
      if (prev.justEvaluated) return { ...prev, display: '0', expression: '', justEvaluated: false };
      const newDisplay = prev.display.length > 1 ? prev.display.slice(0, -1) : '0';
      const newExpr = prev.expression.length > 0 ? prev.expression.slice(0, -1) : '';
      return { ...prev, display: newDisplay, expression: newExpr };
    });
  }, []);

  const handleToggleSign = useCallback(() => {
    setState(prev => {
      const newDisplay = prev.display.startsWith('-')
        ? prev.display.slice(1)
        : '-' + prev.display;
      return { ...prev, display: newDisplay, expression: newDisplay };
    });
  }, []);

  const handlePercent = useCallback(() => {
    setState(prev => {
      try {
        const val = parseFloat(prev.display) / 100;
        const valStr = val.toString();
        return { ...prev, display: valStr, expression: valStr };
      } catch {
        return prev;
      }
    });
  }, []);

  const handleMemoryStore = useCallback(() => {
    setState(prev => ({ ...prev, memory: parseFloat(prev.display) || 0 }));
  }, []);

  const handleMemoryRecall = useCallback(() => {
    setState(prev => ({
      ...prev,
      display: prev.memory.toString(),
      expression: prev.justEvaluated ? prev.memory.toString() : prev.expression + prev.memory.toString(),
      justEvaluated: false
    }));
  }, []);

  const handleMemoryClear = useCallback(() => {
    setState(prev => ({ ...prev, memory: 0 }));
  }, []);

  const handleMemoryAdd = useCallback(() => {
    setState(prev => ({ ...prev, memory: prev.memory + (parseFloat(prev.display) || 0) }));
  }, []);

  const toggleAngleMode = useCallback(() => {
    setState(prev => ({ ...prev, angleMode: prev.angleMode === 'DEG' ? 'RAD' : 'DEG' }));
  }, []);

  const handleParen = useCallback((paren: string) => {
    setState(prev => {
      const newExpr = prev.justEvaluated ? paren : prev.expression + paren;
      return { ...prev, expression: newExpr, display: paren, justEvaluated: false };
    });
  }, []);

  const handleSquare = useCallback(() => {
    setState(prev => {
      const newExpr = prev.justEvaluated
        ? prev.display + '^2'
        : prev.expression + '^2';
      return { ...prev, expression: newExpr, display: '^2', justEvaluated: false };
    });
  }, []);

  const handleCube = useCallback(() => {
    setState(prev => {
      const newExpr = prev.justEvaluated
        ? prev.display + '^3'
        : prev.expression + '^3';
      return { ...prev, expression: newExpr, display: '^3', justEvaluated: false };
    });
  }, []);

  const handleReciprocal = useCallback(() => {
    setState(prev => {
      try {
        const val = 1 / parseFloat(prev.display);
        const valStr = val.toString();
        return { ...prev, display: valStr, expression: valStr, justEvaluated: true };
      } catch {
        return { ...prev, display: 'Error', expression: '' };
      }
    });
  }, []);

  const handleFactorial = useCallback(() => {
    setState(prev => {
      try {
        const n = parseInt(prev.display);
        if (n < 0 || n > 20) return { ...prev, display: 'Error', expression: '' };
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        const resultStr = result.toString();
        return { ...prev, display: resultStr, expression: resultStr, justEvaluated: true };
      } catch {
        return { ...prev, display: 'Error', expression: '' };
      }
    });
  }, []);

  const formatDisplay = (val: string): string => {
    if (val === 'Error') return val;
    if (val.length > 14) {
      const num = parseFloat(val);
      if (!isNaN(num)) return num.toExponential(6);
    }
    return val;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.calculator}>
        <div className={styles.header}>
          <span className={styles.title}>Science Calculator</span>
          <div className={styles.headerControls}>
            <button
              className={`${styles.modeBtn} ${state.angleMode === 'DEG' ? styles.modeBtnActive : ''}`}
              onClick={toggleAngleMode}
            >
              {state.angleMode}
            </button>
            <button
              className={`${styles.historyBtn} ${showHistory ? styles.historyBtnActive : ''}`}
              onClick={() => setShowHistory(h => !h)}
            >
              History
            </button>
          </div>
        </div>

        {showHistory && (
          <div className={styles.historyPanel}>
            {state.history.length === 0 ? (
              <div className={styles.historyEmpty}>No history yet</div>
            ) : (
              state.history.map((entry, i) => (
                <div key={i} className={styles.historyEntry}>{entry}</div>
              ))
            )}
          </div>
        )}

        <div className={styles.displayArea}>
          <div className={styles.expression}>{state.expression || '\u00a0'}</div>
          <div className={styles.display}>{formatDisplay(state.display)}</div>
          {state.memory !== 0 && (
            <div className={styles.memoryIndicator}>M: {state.memory}</div>
          )}
        </div>

        <div className={styles.buttons}>
          <button className={`${styles.btn} ${styles.memBtn}`} onClick={handleMemoryClear}>MC</button>
          <button className={`${styles.btn} ${styles.memBtn}`} onClick={handleMemoryRecall}>MR</button>
          <button className={`${styles.btn} ${styles.memBtn}`} onClick={handleMemoryStore}>MS</button>
          <button className={`${styles.btn} ${styles.memBtn}`} onClick={handleMemoryAdd}>M+</button>
          <button className={`${styles.btn} ${styles.clearBtn}`} onClick={handleAllClear}>AC</button>
          <button className={`${styles.btn} ${styles.clearBtn}`} onClick={handleClear}>C</button>
          <button className={`${styles.btn} ${styles.clearBtn}`} onClick={handleBackspace}>&#9003;</button>

          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('sin')}>sin</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('cos')}>cos</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('tan')}>tan</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('asin')}>sin&#8315;&#185;</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('acos')}>cos&#8315;&#185;</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('atan')}>tan&#8315;&#185;</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={handlePercent}>%</button>

          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('log')}>log</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('ln')}>ln</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('sqrt')}>&#8730;</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('cbrt')}>&#8731;</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={handleSquare}>x&#178;</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={handleCube}>x&#179;</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleOperator('^')}>x&#696;</button>

          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('exp')}>e&#739;</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleFunction('abs')}>|x|</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={handleReciprocal}>1/x</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={handleFactorial}>n!</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleConstant('\u03c0', String(Math.PI.toPrecision(8)))}>&#960;</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={() => handleConstant('e', String(Math.E.toPrecision(8)))}>e</button>
          <button className={`${styles.btn} ${styles.sciBtn}`} onClick={handleToggleSign}>+/-</button>

          <button className={`${styles.btn} ${styles.parenBtn}`} onClick={() => handleParen('(')}>(</button>
          <button className={`${styles.btn} ${styles.parenBtn}`} onClick={() => handleParen(')')}>)</button>
          <button className={`${styles.btn} ${styles.numBtn}`} onClick={() => handleNumber('7')}>7</button>
          <button className={`${styles.btn} ${styles.numBtn}`} onClick={() => handleNumber('8')}>8</button>
          <button className={`${styles.btn} ${styles.numBtn}`} onClick={() => handleNumber('9')}>9</button>
          <button className={`${styles.btn} ${styles.opBtn}`} onClick={() => handleOperator('/')}>/</button>
          <button className={`${styles.btn} ${styles.opBtn}`} onClick={() => handleOperator('*')}>&#215;</button>

          <button className={`${styles.btn} ${styles.numBtn}`} onClick={() => handleNumber('4')}>4</button>
          <button className={`${styles.btn} ${styles.numBtn}`} onClick={() => handleNumber('5')}>5</button>
          <button className={`${styles.btn} ${styles.numBtn}`} onClick={() => handleNumber('6')}>6</button>
          <button className={`${styles.btn} ${styles.opBtn}`} onClick={() => handleOperator('-')}>-</button>
          <button className={`${styles.btn} ${styles.opBtn}`} onClick={() => handleOperator('+')}>+</button>
          <button className={`${styles.btn} ${styles.numBtn}`} onClick={() => handleNumber('1')}>1</button>
          <button className={`${styles.btn} ${styles.numBtn}`} onClick={() => handleNumber('2')}>2</button>

          <button className={`${styles.btn} ${styles.numBtn}`} onClick={() => handleNumber('3')}>3</button>
          <button className={`${styles.btn} ${styles.numBtn} ${styles.zeroBtn}`} onClick={() => handleNumber('0')}>0</button>
          <button className={`${styles.btn} ${styles.numBtn}`} onClick={handleDecimal}>.</button>
          <button className={`${styles.btn} ${styles.eqBtn}`} onClick={handleEquals}>=</button>
        </div>
      </div>
    </div>
  );
}
