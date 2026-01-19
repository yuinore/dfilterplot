import type { PoleOrZero } from '../types';
import type { ComponentType } from 'react';

/**
 * フィルタ生成結果
 */
export interface FilterGenerationResult {
  poles: PoleOrZero[];
  zeros: PoleOrZero[];
  gain: number;
}

/**
 * フィルタUIコンポーネントのProps
 */
export interface FilterPanelProps {
  onChange: (params: Record<string, any>) => void;
  logarithmicFrequency?: boolean;
}

/**
 * フィルタ設計の基底インターフェース
 */
export interface FilterDesignBase {
  /** フィルタID */
  id: string;
  /** フィルタ名（i18nキー） */
  nameKey: string;
  /** フィルタの説明（i18nキー、オプション） */
  descriptionKey?: string;
  /** フィルタのUIコンポーネント */
  PanelComponent: ComponentType<FilterPanelProps>;
  
  /**
   * フィルタを生成
   * @param params パラメータの値
   * @returns 極・零点・ゲイン
   */
  generate(params: Record<string, any>): FilterGenerationResult;
}

/**
 * フィルタレジストリ
 */
export class FilterRegistry {
  private static filters = new Map<string, FilterDesignBase>();

  /**
   * フィルタを登録
   */
  static register(filter: FilterDesignBase): void {
    this.filters.set(filter.id, filter);
  }

  /**
   * フィルタを取得
   */
  static get(id: string): FilterDesignBase | undefined {
    return this.filters.get(id);
  }

  /**
   * 全フィルタを取得
   */
  static getAll(): FilterDesignBase[] {
    return Array.from(this.filters.values());
  }

  /**
   * フィルタIDのリストを取得
   */
  static getIds(): string[] {
    return Array.from(this.filters.keys());
  }
}

