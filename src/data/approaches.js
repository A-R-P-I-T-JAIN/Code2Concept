export const approaches = [
  {
    title: "Brute Force Approach",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    description: "Check all possible pairs to find the target sum",
    code: `public int[] twoSum(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) {
        for (int j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] == target) {
                return new int[] { i, j };
            }
        }
    }
    return new int[] {};
}

# Time: O(n²), Space: O(1)
# Simple but inefficient for large inputs`,
    pros: ["Easy to understand", "No extra space needed"],
    cons: ["Very slow for large inputs", "O(n²) time complexity"],
    videoDuration: "5:22",
    concepts: ["Nested Loops", "Basic Iteration", "Pair Checking"]
  },
  {
    title: "Hash Map Approach",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    description: "Use hash map to store complements for O(n) solution",
    code: `public int[] twoSum(int[] nums, int target) {
    HashMap<Integer, Integer> map = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];

        if (map.containsKey(complement)) {
            return new int[] { map.get(complement), i };
        }

        map.put(nums[i], i);
    }

    return new int[] {};
}

# Time: O(n), Space: O(n)
# Optimal solution with hash map`,
    pros: ["Linear time complexity", "Single pass solution"],
    cons: ["Uses extra space", "Hash collisions possible"],
    videoDuration: "8:42",
    concepts: ["Hash Maps", "Complements", "Single Pass"]
  },
  {
    title: "Two Pointer Approach",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(1)",
    description: "Sort array first, then use two pointers (if indices not required)",
    code: `
public int[] twoSum(int[] nums, int target) {
    int[][] indexed = new int[nums.length][2];

    for (int i = 0; i < nums.length; i++) {
        indexed[i][0] = nums[i];  // value
        indexed[i][1] = i;        // original index
    }

    Arrays.sort(indexed, (a, b) -> Integer.compare(a[0], b[0]));

    int left = 0, right = nums.length - 1;

    while (left < right) {
        int sum = indexed[left][0] + indexed[right][0];

        if (sum == target) {
            return new int[] { indexed[left][1], indexed[right][1] };
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return new int[] {};
}
# Time: O(n log n), Space: O(n)`,
    pros: ["Good for sorted arrays", "Easy to understand"],
    cons: ["Requires sorting", "Not optimal for this problem"],
    videoDuration: "7:15",
    concepts: ["Sorting", "Two Pointers", "Index Mapping"]
  }
]; 