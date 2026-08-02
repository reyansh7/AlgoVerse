import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray, showArrayMap, kindsRange } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type Arr = { array: number[] };
type ArrTarget = { array: number[]; target: number };
type Str = { s: string };

function windowKinds(left: number, right: number) {
  return {
    ...kindsRange(left, right, "searching"),
    [left]: "left" as const,
    [right]: "right" as const,
  };
}

export const twoPointersFamily: ProblemPackage[] = [
  createProblem({
    id: 11,
    title: "Container With Most Water",
    difficulty: "medium",
    category: "two-pointers",
    tags: ["array", "two-pointers", "greedy"],
    inputSchema: "array",
    statement: `# 11. Container With Most Water

Given \`height\`, find two lines that together with the x-axis form a container that holds the most water. Return the maximum area.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 8, 6, 2, 5, 4, 8, 3, 7] } },
      { label: "Example 2", input: { array: [1, 1] } },
    ],
    solutions: [
      sol<Arr>({
        id: "11-two-pointers",
        name: "Two Pointers",
        time: "O(n)",
        space: "O(1)",
        code: `function maxArea(height: number[]): number {
  let left = 0, right = height.length - 1, best = 0;
  while (left < right) {
    const w = right - left;
    const h = Math.min(height[left], height[right]);
    best = Math.max(best, w * h);
    if (height[left] < height[right]) left++;
    else right--;
  }
  return best;
}`,
        execute({ array }) {
          const r = new EventRecorder("11-two-pointers");
          const height = [...array];
          let left = 0;
          let right = height.length - 1;
          let best = 0;
          showArray(r, height, "Opposing pointers — move the shorter wall inward.", {
            kinds: windowKinds(left, right),
            vars: { left, right, best },
          });
          while (left < right) {
            const w = right - left;
            const h = Math.min(height[left], height[right]);
            const area = w * h;
            best = Math.max(best, area);
            r.movePointer("left", left);
            r.movePointer("right", right);
            showArray(
              r,
              height,
              `Width=${w}, height=min(${height[left]},${height[right]})=${h} → area=${area}. Best=${best}.`,
              {
                line: 4,
                kinds: windowKinds(left, right),
                vars: { left, right, best, area },
              },
            );
            if (height[left] < height[right]) {
              left++;
              showArray(r, height, `Left wall is shorter — advance left to ${left}.`, {
                kinds: { [left]: "left", [right]: "right" },
                vars: { left, right, best },
              });
            } else {
              right--;
              showArray(r, height, `Right wall is shorter or equal — advance right to ${right}.`, {
                kinds: { [left]: "left", [right]: "right" },
                vars: { left, right, best },
              });
            }
          }
          showArray(r, height, `Maximum container area = ${best}.`, {
            vars: { best },
          });
          r.returnValue(best, { description: `Return max area ${best}.` });
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 15,
    title: "3Sum",
    difficulty: "medium",
    category: "two-pointers",
    tags: ["array", "two-pointers", "sorting"],
    inputSchema: "array",
    statement: `# 15. 3Sum

Return all unique triplets in \`nums\` that sum to zero.`,
    testcases: [
      { label: "Example 1", input: { array: [-1, 0, 1, 2, -1, -4] } },
      { label: "Example 2", input: { array: [0, 1, 1] } },
      { label: "Example 3", input: { array: [0, 0, 0] } },
    ],
    solutions: [
      sol<Arr>({
        id: "15-sort-two-pointers",
        name: "Sort + Two Pointers",
        time: "O(n²)",
        space: "O(1) extra",
        code: `function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const out: number[][] = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s === 0) { out.push([nums[i], nums[l], nums[r]]); l++; r--; }
      else if (s < 0) l++; else r--;
    }
  }
  return out;
}`,
        execute({ array }) {
          const r = new EventRecorder("15-sort-two-pointers");
          const nums = [...array].sort((a, b) => a - b);
          const out: number[][] = [];
          showArray(r, nums, "Sort array, then fix index i and scan with two pointers.", {
            sorted: nums.map((_, i) => i),
            vars: { triplets: out.length },
          });
          for (let i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] === nums[i - 1]) {
              showArray(r, nums, `Skip duplicate anchor nums[${i}]=${nums[i]}.`, {
                kinds: { [i]: "swapped" },
                vars: { i },
              });
              continue;
            }
            let l = i + 1;
            let rIdx = nums.length - 1;
            showArray(r, nums, `Anchor i=${i} (${nums[i]}). Search pair in [${l}, ${rIdx}].`, {
              kinds: { [i]: "pivot", [l]: "left", [rIdx]: "right" },
              vars: { i, l, r: rIdx },
            });
            while (l < rIdx) {
              const sum = nums[i] + nums[l] + nums[rIdx];
              showArray(
                r,
                nums,
                `${nums[i]}+${nums[l]}+${nums[rIdx]}=${sum}. ${sum === 0 ? "Zero triplet!" : sum < 0 ? "Too small — move left." : "Too large — move right."}`,
                {
                  line: 8,
                  kinds: { [i]: "pivot", [l]: "left", [rIdx]: "right" },
                  vars: { i, l, r: rIdx, sum },
                },
              );
              if (sum === 0) {
                out.push([nums[i], nums[l], nums[rIdx]]);
                showArray(r, nums, `Record triplet [${nums[i]}, ${nums[l]}, ${nums[rIdx]}].`, {
                  kinds: { [i]: "found", [l]: "found", [rIdx]: "found" },
                  vars: { triplets: out },
                });
                l++;
                rIdx--;
                while (l < rIdx && nums[l] === nums[l - 1]) l++;
                while (l < rIdx && nums[rIdx] === nums[rIdx + 1]) rIdx--;
              } else if (sum < 0) {
                l++;
              } else {
                rIdx--;
              }
            }
          }
          showArray(r, nums, `Found ${out.length} unique triplets.`, {
            vars: { result: out },
          });
          r.returnValue(out, { description: `Return ${out.length} triplets.` });
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 16,
    title: "3Sum Closest",
    difficulty: "medium",
    category: "two-pointers",
    tags: ["array", "two-pointers", "sorting"],
    inputSchema: "array-target",
    statement: `# 16. 3Sum Closest

Find three integers in \`nums\` such that the sum is closest to \`target\`. Return that sum.`,
    testcases: [
      { label: "Example 1", input: { array: [-1, 2, 1, -4], target: 1 } },
      { label: "Example 2", input: { array: [0, 0, 0], target: 1 } },
    ],
    solutions: [
      sol<ArrTarget>({
        id: "16-closest",
        name: "Sort + Closest Tracking",
        time: "O(n²)",
        space: "O(1) extra",
        code: `function threeSumClosest(nums: number[], target: number): number {
  nums.sort((a, b) => a - b);
  let best = nums[0] + nums[1] + nums[2];
  for (let i = 0; i < nums.length - 2; i++) {
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (Math.abs(s - target) < Math.abs(best - target)) best = s;
      if (s < target) l++; else if (s > target) r--; else return s;
    }
  }
  return best;
}`,
        execute({ array, target }) {
          const r = new EventRecorder("16-closest");
          const nums = [...array].sort((a, b) => a - b);
          let best = nums[0] + nums[1] + nums[2];
          showArray(r, nums, `Target=${target}. Track closest sum (start ${best}).`, {
            sorted: nums.map((_, i) => i),
            vars: { target, best },
          });
          for (let i = 0; i < nums.length - 2; i++) {
            let l = i + 1;
            let rIdx = nums.length - 1;
            showArray(r, nums, `Anchor i=${i}. Two-pointer scan for closest sum.`, {
              kinds: { [i]: "pivot", [l]: "left", [rIdx]: "right" },
              vars: { i, l, r: rIdx, best },
            });
            while (l < rIdx) {
              const sum = nums[i] + nums[l] + nums[rIdx];
              const diff = Math.abs(sum - target);
              const bestDiff = Math.abs(best - target);
              if (diff < bestDiff) {
                best = sum;
                showArray(
                  r,
                  nums,
                  `Sum ${sum} is closer to ${target} (|diff|=${diff}). Update best=${best}.`,
                  {
                    kinds: { [i]: "found", [l]: "found", [rIdx]: "found" },
                    vars: { sum, best, target },
                  },
                );
              } else {
                showArray(
                  r,
                  nums,
                  `Sum ${sum}, |${sum}-${target}|=${diff} vs best gap ${bestDiff}.`,
                  {
                    kinds: { [i]: "pivot", [l]: "left", [rIdx]: "right" },
                    vars: { sum, best },
                  },
                );
              }
              if (sum === target) {
                r.returnValue(sum, { description: `Exact match sum=${sum}.` });
                r.done(sum);
                return r.getEvents();
              }
              if (sum < target) l++;
              else rIdx--;
            }
          }
          showArray(r, nums, `Closest sum to ${target} is ${best}.`, { vars: { best } });
          r.returnValue(best);
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 18,
    title: "4Sum",
    difficulty: "medium",
    category: "two-pointers",
    tags: ["array", "two-pointers", "sorting"],
    inputSchema: "array-target",
    statement: `# 18. 4Sum

Return all unique quadruplets in \`nums\` that sum to \`target\`.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 0, -1, 0, -2, 2], target: 0 } },
      { label: "Example 2", input: { array: [2, 2, 2, 2, 2], target: 8 } },
    ],
    solutions: [
      sol<ArrTarget>({
        id: "18-four-sum",
        name: "Sort + Dual Anchors",
        time: "O(n³)",
        space: "O(1) extra",
        code: `function fourSum(nums: number[], target: number): number[][] {
  nums.sort((a, b) => a - b);
  const out: number[][] = [];
  for (let i = 0; i < nums.length - 3; i++) {
    for (let j = i + 1; j < nums.length - 2; j++) {
      let l = j + 1, r = nums.length - 1;
      while (l < r) {
        const s = nums[i]+nums[j]+nums[l]+nums[r];
        if (s === target) { out.push([nums[i],nums[j],nums[l],nums[r]]); l++; r--; }
        else if (s < target) l++; else r--;
      }
    }
  }
  return out;
}`,
        execute({ array, target }) {
          const r = new EventRecorder("18-four-sum");
          const nums = [...array].sort((a, b) => a - b);
          const out: number[][] = [];
          showArray(r, nums, `Find quadruplets summing to ${target}.`, {
            sorted: nums.map((_, i) => i),
            vars: { target },
          });
          for (let i = 0; i < nums.length - 3; i++) {
            if (i > 0 && nums[i] === nums[i - 1]) continue;
            for (let j = i + 1; j < nums.length - 2; j++) {
              if (j > i + 1 && nums[j] === nums[j - 1]) continue;
              let l = j + 1;
              let rIdx = nums.length - 1;
              showArray(
                r,
                nums,
                `Anchors i=${i} (${nums[i]}), j=${j} (${nums[j]}). Two-pointer scan.`,
                {
                  kinds: {
                    [i]: "pivot",
                    [j]: "selected",
                    [l]: "left",
                    [rIdx]: "right",
                  },
                  vars: { i, j, l, r: rIdx },
                },
              );
              while (l < rIdx) {
                const sum = nums[i] + nums[j] + nums[l] + nums[rIdx];
                showArray(
                  r,
                  nums,
                  `Sum=${sum} vs target=${target}. ${sum === target ? "Match!" : sum < target ? "Too small." : "Too large."}`,
                  {
                    kinds: {
                      [i]: "pivot",
                      [j]: "selected",
                      [l]: "left",
                      [rIdx]: "right",
                    },
                    vars: { sum, target },
                  },
                );
                if (sum === target) {
                  out.push([nums[i], nums[j], nums[l], nums[rIdx]]);
                  showArray(r, nums, `Record [${nums[i]}, ${nums[j]}, ${nums[l]}, ${nums[rIdx]}].`, {
                    kinds: {
                      [i]: "found",
                      [j]: "found",
                      [l]: "found",
                      [rIdx]: "found",
                    },
                    vars: { quadruplets: out },
                  });
                  l++;
                  rIdx--;
                } else if (sum < target) {
                  l++;
                } else {
                  rIdx--;
                }
              }
            }
          }
          showArray(r, nums, `Found ${out.length} unique quadruplets.`, { vars: { result: out } });
          r.returnValue(out);
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 42,
    title: "Trapping Rain Water",
    difficulty: "hard",
    category: "two-pointers",
    tags: ["array", "two-pointers", "stack"],
    inputSchema: "array",
    statement: `# 42. Trapping Rain Water

Given elevation \`height\`, compute how much rain water can be trapped after raining.`,
    testcases: [
      { label: "Example 1", input: { array: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] } },
      { label: "Example 2", input: { array: [4, 2, 0, 3, 2, 5] } },
    ],
    solutions: [
      sol<Arr>({
        id: "42-two-pointers",
        name: "Two Pointers",
        time: "O(n)",
        space: "O(1)",
        code: `function trap(height: number[]): number {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];
      right--;
    }
  }
  return water;
}`,
        execute({ array }) {
          const r = new EventRecorder("42-two-pointers");
          const height = [...array];
          let left = 0;
          let right = height.length - 1;
          let leftMax = 0;
          let rightMax = 0;
          let water = 0;
          showArray(r, height, "Two pointers with running leftMax and rightMax.", {
            kinds: windowKinds(left, right),
            vars: { leftMax, rightMax, water },
          });
          while (left < right) {
            if (height[left] < height[right]) {
              leftMax = Math.max(leftMax, height[left]);
              const add = leftMax - height[left];
              water += add;
              showArray(
                r,
                height,
                `Left side: leftMax=${leftMax}, bar=${height[left]} → trap +${add} (total ${water}). Move left.`,
                {
                  line: 5,
                  kinds: { [left]: "left", [right]: "right", ...kindsRange(0, left, "merged") },
                  vars: { left, right, leftMax, water, trapped: add },
                },
              );
              left++;
            } else {
              rightMax = Math.max(rightMax, height[right]);
              const add = rightMax - height[right];
              water += add;
              showArray(
                r,
                height,
                `Right side: rightMax=${rightMax}, bar=${height[right]} → trap +${add} (total ${water}). Move right.`,
                {
                  line: 9,
                  kinds: { [left]: "left", [right]: "right", ...kindsRange(right, height.length - 1, "merged") },
                  vars: { left, right, rightMax, water, trapped: add },
                },
              );
              right--;
            }
          }
          showArray(r, height, `Total trapped water = ${water} units.`, { vars: { water } });
          r.returnValue(water, { description: `Return ${water}.` });
          r.done(water);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 125,
    title: "Valid Palindrome",
    difficulty: "easy",
    category: "two-pointers",
    tags: ["string", "two-pointers"],
    inputSchema: "window",
    statement: `# 125. Valid Palindrome

Return true if \`s\` is a palindrome after converting to lowercase and removing non-alphanumeric characters.`,
    testcases: [
      { label: "Example 1", input: { s: "A man, a plan, a canal: Panama" } },
      { label: "Example 2", input: { s: "race a car" } },
      { label: "Example 3", input: { s: " " } },
    ],
    solutions: [
      sol<Str>({
        id: "125-two-pointers",
        name: "Two Pointers",
        time: "O(n)",
        space: "O(1)",
        code: `function isPalindrome(s: string): boolean {
  let l = 0, r = s.length - 1;
  const ok = (c: string) => /[a-z0-9]/i.test(c);
  while (l < r) {
    while (l < r && !ok(s[l])) l++;
    while (l < r && !ok(s[r])) r--;
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++; r--;
  }
  return true;
}`,
        execute({ s }) {
          const r = new EventRecorder("125-two-pointers");
          const chars = s.split("");
          const ok = (c: string) => /[a-z0-9]/i.test(c);
          let l = 0;
          let rIdx = chars.length - 1;
          showArray(r, chars, "Scan inward, skipping non-alphanumeric characters.", {
            kinds: { [l]: "left", [rIdx]: "right" },
            vars: { l, r: rIdx },
          });
          while (l < rIdx) {
            while (l < rIdx && !ok(chars[l])) {
              showArray(r, chars, `Skip non-alphanumeric at left index ${l} ('${chars[l]}').`, {
                kinds: { [l]: "swapped" },
              });
              l++;
            }
            while (l < rIdx && !ok(chars[rIdx])) {
              showArray(r, chars, `Skip non-alphanumeric at right index ${rIdx} ('${chars[rIdx]}').`, {
                kinds: { [rIdx]: "swapped" },
              });
              rIdx--;
            }
            if (l >= rIdx) break;
            const lc = chars[l].toLowerCase();
            const rc = chars[rIdx].toLowerCase();
            showArray(
              r,
              chars,
              `Compare '${lc}' (index ${l}) vs '${rc}' (index ${rIdx}).`,
              {
                line: 6,
                kinds: { [l]: "left", [rIdx]: "right" },
                vars: { l, r: rIdx },
              },
            );
            if (lc !== rc) {
              showArray(r, chars, `Mismatch — not a palindrome.`, {
                kinds: { [l]: "swapped", [rIdx]: "swapped" },
              });
              r.returnValue(false, { description: "Characters differ." });
              r.done(false);
              return r.getEvents();
            }
            showArray(r, chars, `Match — move both pointers inward.`, {
              kinds: { [l]: "found", [rIdx]: "found" },
            });
            l++;
            rIdx--;
          }
          showArray(r, chars, "All pairs matched — valid palindrome.", {});
          r.returnValue(true);
          r.done(true);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 344,
    title: "Reverse String",
    difficulty: "easy",
    category: "two-pointers",
    tags: ["string", "two-pointers"],
    inputSchema: "window",
    statement: `# 344. Reverse String

Reverse the character array \`s\` in-place using O(1) extra space.`,
    testcases: [
      { label: "Example 1", input: { s: "hello" } },
      { label: "Example 2", input: { s: "Hannah" } },
    ],
    solutions: [
      sol<Str>({
        id: "344-swap",
        name: "Swap Ends",
        time: "O(n)",
        space: "O(1)",
        code: `function reverseString(s: string[]): void {
  let l = 0, r = s.length - 1;
  while (l < r) {
    [s[l], s[r]] = [s[r], s[l]];
    l++; r--;
  }
}`,
        execute({ s }) {
          const r = new EventRecorder("344-swap");
          const chars = s.split("");
          let l = 0;
          let rIdx = chars.length - 1;
          showArray(r, chars, "Swap characters from both ends moving inward.", {
            kinds: { [l]: "left", [rIdx]: "right" },
          });
          while (l < rIdx) {
            showArray(
              r,
              chars,
              `Swap index ${l} ('${chars[l]}') ↔ index ${rIdx} ('${chars[rIdx]}').`,
              {
                line: 3,
                kinds: { [l]: "left", [rIdx]: "right" },
              },
            );
            r.swap(l, rIdx, { description: `Swap '${chars[l]}' and '${chars[rIdx]}'.` });
            [chars[l], chars[rIdx]] = [chars[rIdx], chars[l]];
            showArray(r, chars, `After swap: [${chars.join("")}]. Advance pointers.`, {
              kinds: { [l]: "merged", [rIdx]: "merged" },
            });
            l++;
            rIdx--;
            if (l < rIdx) {
              showArray(r, chars, `Next pair: left=${l}, right=${rIdx}.`, {
                kinds: { [l]: "left", [rIdx]: "right" },
              });
            }
          }
          showArray(r, chars, `Reversed string: "${chars.join("")}".`, {
            sorted: chars.map((_, i) => i),
          });
          r.done(chars.join(""));
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 977,
    title: "Squares of a Sorted Array",
    difficulty: "easy",
    category: "two-pointers",
    tags: ["array", "two-pointers", "sorting"],
    inputSchema: "array",
    statement: `# 977. Squares of a Sorted Array

Given a sorted integer array \`nums\`, return the squares of each number sorted in non-decreasing order.`,
    testcases: [
      { label: "Example 1", input: { array: [-4, -1, 0, 3, 10] } },
      { label: "Example 2", input: { array: [-7, -3, 2, 3, 11] } },
    ],
    solutions: [
      sol<Arr>({
        id: "977-merge-from-ends",
        name: "Two Pointers Fill",
        time: "O(n)",
        space: "O(n)",
        code: `function sortedSquares(nums: number[]): number[] {
  let l = 0, r = nums.length - 1, k = nums.length - 1;
  const out = Array(nums.length);
  while (l <= r) {
    const lv = nums[l] * nums[l], rv = nums[r] * nums[r];
    if (lv > rv) { out[k--] = lv; l++; } else { out[k--] = rv; r--; }
  }
  return out;
}`,
        execute({ array }) {
          const r = new EventRecorder("977-merge-from-ends");
          const nums = [...array];
          const out = Array<number>(nums.length).fill(0);
          let l = 0;
          let rIdx = nums.length - 1;
          let k = nums.length - 1;
          showArray(r, nums, "Compare squares at both ends; write larger to output back.", {
            kinds: { [l]: "left", [rIdx]: "right" },
            vars: { k },
          });
          while (l <= rIdx) {
            const lv = nums[l] * nums[l];
            const rv = nums[rIdx] * nums[rIdx];
            showArray(
              r,
              nums,
              `Compare ${nums[l]}²=${lv} vs ${nums[rIdx]}²=${rv}. Place ${lv > rv ? lv : rv} at out[${k}].`,
              {
                line: 5,
                kinds: { [l]: "left", [rIdx]: "right" },
                vars: { l, r: rIdx, k, lv, rv },
              },
            );
            if (lv > rv) {
              out[k] = lv;
              showArray(r, out, `Write ${lv} at index ${k} from left pointer.`, {
                kinds: { [k]: "write" },
                vars: { k, out: [...out] },
              });
              l++;
            } else {
              out[k] = rv;
              showArray(r, out, `Write ${rv} at index ${k} from right pointer.`, {
                kinds: { [k]: "write" },
                vars: { k, out: [...out] },
              });
              rIdx--;
            }
            k--;
          }
          showArray(r, out, `Sorted squares: [${out.join(", ")}].`, {
            sorted: out.map((_, i) => i),
          });
          r.returnValue(out);
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),
];
