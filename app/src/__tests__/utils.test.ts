import { describe, it, expect } from 'vitest'

describe('レビュー評価計算', () => {
  const calcAverage = (ratings: number[]): number => {
    if (ratings.length === 0) return 0
    return Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
  }

  it('評価の平均を正しく計算できる', () => {
    expect(calcAverage([4, 5, 3])).toBe(4)
  })

  it('評価が1件の場合はその値をそのまま返す', () => {
    expect(calcAverage([5])).toBe(5)
  })

  it('評価が空の場合は0を返す', () => {
    expect(calcAverage([])).toBe(0)
  })

  it('小数点以下1桁に丸められる', () => {
    expect(calcAverage([4, 5])).toBe(4.5)
  })
})
