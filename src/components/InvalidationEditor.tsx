// src/components/InvalidationEditor.tsx

import { useState, useEffect } from 'react';
import type {
  InvalidationCondition,
  InvalidationField,
  InvalidationOperator,
} from '../types/invalidation';
import {
  FIELD_LABELS,
  OPERATOR_LABELS,
} from '../types/invalidation';
import {
  loadInvalidations,
  addInvalidation,
  removeInvalidation,
  describeCondition,
} from '../core/invalidationEngine';

interface InvalidationEditorProps {
  open: boolean;
  onClose: () => void;
  onChange: () => void;   // Уведомляем StatusScreen об изменениях
}

/**
 * Модалка «Что изменит моё мнение?».
 *
 * Пользователь записывает заранее условия, при которых
 * он пересмотрит сценарий.
 */
export function InvalidationEditor({ open, onClose, onChange }: InvalidationEditorProps) {
  const [list, setList] = useState<InvalidationCondition[]>([]);
  const [field, setField] = useState<InvalidationField>('inflation');
  const [operator, setOperator] = useState<InvalidationOperator>('>');
  const [value, setValue] = useState<string>('8');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (open) setList(loadInvalidations());
  }, [open]);

  if (!open) return null;

  const handleAdd = () => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue)) return;
    addInvalidation(field, operator, numValue, note.trim() || undefined);
    setList(loadInvalidations());
    setValue('8');
    setNote('');
    onChange();
  };

  const handleRemove = (id: string) => {
    removeInvalidation(id);
    setList(loadInvalidations());
    onChange();
  };

  return (
    <div className="invalidation-editor-overlay" onClick={onClose}>
      <div className="invalidation-editor" onClick={(e) => e.stopPropagation()}>
        <div className="invalidation-editor-header">
          <h2>⚠️ Что изменит моё мнение?</h2>
          <button className="invalidation-editor-close" onClick={onClose}>✕</button>
        </div>

        <p className="invalidation-editor-intro">
          Запиши заранее, при каких условиях ты пересмотришь сценарий.
          Приложение будет следить и предупредит, если условие сработает.
        </p>

        {/* Существующие условия */}
        {list.length > 0 && (
          <div className="invalidation-editor-list">
            {list.map((c) => (
              <div key={c.id} className="invalidation-editor-item">
                <div className="invalidation-editor-item-text">
                  <div className="invalidation-editor-item-rule">
                    {describeCondition(c)}
                  </div>
                  {c.note && (
                    <div className="invalidation-editor-item-note">
                      {c.note}
                    </div>
                  )}
                </div>
                <button
                  className="invalidation-editor-item-remove"
                  onClick={() => handleRemove(c.id)}
                  title="Удалить"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}

        {list.length === 0 && (
          <p className="invalidation-editor-empty">
            Пока нет условий. Добавь первое ниже.
          </p>
        )}

        {/* Форма добавления */}
        <div className="invalidation-editor-form">
          <div className="invalidation-editor-form-title">Добавить условие:</div>

          <div className="invalidation-editor-row">
            <label>Поле</label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value as InvalidationField)}
            >
              {(Object.keys(FIELD_LABELS) as InvalidationField[]).map((f) => (
                <option key={f} value={f}>{FIELD_LABELS[f]}</option>
              ))}
            </select>
          </div>

          <div className="invalidation-editor-row">
            <label>Оператор</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as InvalidationOperator)}
            >
              {(Object.keys(OPERATOR_LABELS) as InvalidationOperator[]).map((op) => (
                <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
              ))}
            </select>
          </div>

          <div className="invalidation-editor-row">
            <label>Значение, %</label>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="invalidation-editor-row">
            <label>Заметка (опц.)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: «выйти из ОФЗ»"
              maxLength={80}
            />
          </div>

          <button className="invalidation-editor-add" onClick={handleAdd}>
            + Добавить условие
          </button>
        </div>

        <div className="invalidation-editor-actions">
          <button className="invalidation-editor-btn-primary" onClick={onClose}>
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}