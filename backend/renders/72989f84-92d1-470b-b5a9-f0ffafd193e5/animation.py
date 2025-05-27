from manim import *

class ClimbStairs(Scene):
    def construct(self):
        n = 5  # Example input
        title = Text(f"Climbing Stairs Problem (n = {n})").to_edge(UP)
        self.play(Write(title))
        self.wait(2)

        # Narration 1
        narration1 = Text("We want to find the number of ways to climb n stairs.").to_edge(DOWN)
        self.play(Write(narration1))
        self.wait(2)
        self.play(FadeOut(narration1))

        # Narration 2
        narration2 = Text("If n is 1 or 2, the answer is n because those are the base cases.").to_edge(DOWN)
        self.play(Write(narration2))
        self.wait(2)
        self.play(FadeOut(narration2))

        # Variables
        prev1_label = Text("prev1 = ").to_edge(UP + RIGHT)
        prev1_value = Integer(2).next_to(prev1_label, RIGHT)
        prev2_label = Text("prev2 = ").next_to(prev1_label, DOWN, aligned_edge=RIGHT)
        prev2_value = Integer(1).next_to(prev2_label, RIGHT)
        result_label = Text("result = ").next_to(prev2_label, DOWN, aligned_edge=RIGHT)
        result_value = Integer(0).next_to(result_label, RIGHT)
        i_label = Text("i = ").next_to(result_label, DOWN, aligned_edge=RIGHT)
        i_value = Integer(3).next_to(i_label, RIGHT)
        variables = VGroup(prev1_label, prev1_value, prev2_label, prev2_value, result_label, result_value, i_label, i_value)
        self.play(Create(variables))
        self.wait(1)

        # Narration 3
        narration3 = Text("Initialize prev1 to 2 and prev2 to 1.").to_edge(DOWN)
        self.play(Write(narration3))
        self.wait(2)
        self.play(FadeOut(narration3))

        # Narration 4
        narration4 = Text("We iterate from 3 to n to calculate the number of ways for each step.").to_edge(DOWN)
        self.play(Write(narration4))
        self.wait(2)
        self.play(FadeOut(narration4))

        for i in range(3, n + 1):
            # Narration 5
            narration5 = Text("The number of ways to climb i stairs is the sum of ways to climb i-1 and i-2 stairs.").to_edge(DOWN)
            self.play(Write(narration5))
            self.wait(2)
            self.play(FadeOut(narration5))

            # Narration 6
            narration6 = Text("Calculate the result as prev1 + prev2, which represents the current number of ways.").to_edge(DOWN)
            self.play(Write(narration6))
            result = prev1_value.number + prev2_value.number
            self.play(Transform(result_value, Integer(result).next_to(result_label, RIGHT)))
            self.wait(2)
            self.play(FadeOut(narration6))

            # Narration 7
            narration7 = Text("Update prev2 to be prev1, shifting the values for the next calculation.").to_edge(DOWN)
            self.play(Write(narration7))
            self.play(Transform(prev2_value, Integer(prev1_value.number).next_to(prev2_label, RIGHT)))
            self.wait(2)
            self.play(FadeOut(narration7))

            # Narration 8
            narration8 = Text("Update prev1 to be the result, storing the current number of ways.").to_edge(DOWN)
            self.play(Write(narration8))
            self.play(Transform(prev1_value, Integer(result).next_to(prev1_label, RIGHT)))
            self.wait(2)
            self.play(FadeOut(narration8))
            
            if i < n:
                self.play(Transform(i_value, Integer(i+1).next_to(i_label, RIGHT)))

        # Narration 9
        narration9 = Text("Repeat the calculation and update until i reaches n.").to_edge(DOWN)
        self.play(Write(narration9))
        self.wait(2)
        self.play(FadeOut(narration9))

        # Narration 10
        narration10 = Text("Finally, return the result, which holds the number of ways to climb n stairs.").to_edge(DOWN)
        self.play(Write(narration10))
        self.wait(3)
        self.play(FadeOut(narration10))

        final_result = Text(f"Number of ways to climb {n} stairs: {result}").to_edge(DOWN)
        self.play(Write(final_result))
        self.wait(5)