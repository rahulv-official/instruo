---
title: Sudoku
description: Complete a classic 9×9 number puzzle directly in your browser.
category: Number
tags: [sudoku, number-game, logic, daily-game, puzzle]
icon: i-tabler-grid-3x3
---

::Sudoku
::

## Rules

1. Fill every empty square with a number from 1 to 9.
2. Each row must contain every number exactly once.
3. Each column must contain every number exactly once.
4. Each outlined 3×3 box must contain every number exactly once.
5. Pre-filled squares are fixed and cannot be changed.

## Difficulty levels

- Beginner: 36 to 39 pre-filled squares and 42 to 45 empty squares.
- Intermediate: 30 to 32 pre-filled squares and 49 to 51 empty squares.
- Hard: 23 to 28 pre-filled squares and 53 to 58 empty squares.

## Keyboard controls

Select a square, use number keys to enter values, arrow keys to move, and Backspace or Delete to clear a square.

## A brief history

Howard Garns designed the puzzle that appeared as Number Place in 1979. Japanese publisher Nikoli introduced its version and the Sudoku name in 1984. The modern puzzle reached a broad international audience after appearing in The Times in 2004.

Sources: [Cornell University Mathematics](https://pi.math.cornell.edu/~mec/Summer2009/Mahmood/Intro.html) and [Wolfram MathWorld](https://mathworld.wolfram.com/Sudoku.html).

## Puzzle integrity

Puzzles are generated locally with `sudoku-gen`. Before a board is shown, Instruo verifies the completed grid, checks every pre-filled value against it, and confirms that the puzzle has exactly one solution.
