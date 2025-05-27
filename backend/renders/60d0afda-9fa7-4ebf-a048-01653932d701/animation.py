from manim import *

class LongestPalindrome(Scene):
    def construct(self):
        title = Text("Longest Palindromic Substring", font_size=24).to_corner(UL)
        self.add(title)

        s = "babad"
        processed_s = "^#b#a#b#a#d#$"
        n = len(processed_s)
        P = [0] * n

        # Array Visualization
        array_group = VGroup()
        for i in range(n):
            square = Square(side_length=0.5)
            text = Text(processed_s[i], font_size=24)
            text.move_to(square.get_center())
            group = VGroup(square, text)
            array_group.add(group)

        array_group.arrange(RIGHT, buff=0.15)
        array_group.move_to(ORIGIN)

        self.play(Create(array_group), run_time=1)

        # P Array Visualization (initially all zeros)
        p_array_group = VGroup()
        for i in range(n):
            square = Square(side_length=0.5)
            text = Text(str(P[i]), font_size=24)
            text.move_to(square.get_center())
            group = VGroup(square, text)
            p_array_group.add(group)

        p_array_group.arrange(RIGHT, buff=0.15)
        p_array_group.next_to(array_group, DOWN, buff=0.5)

        p_text = Text("P Array", font_size=24).next_to(p_array_group, LEFT, buff=0.5)

        self.play(Create(p_array_group), Create(p_text), run_time=1)

        # Variables Visualization
        center = 0
        right = 0
        maxLen = 0
        maxCenter = 0

        center_text = Text(f"Center = {center}", font_size=24).to_corner(UR)
        right_text = Text(f"Right = {right}", font_size=24).next_to(center_text, DOWN, aligned_edge=UR)
        maxLen_text = Text(f"MaxLen = {maxLen}", font_size=24).next_to(right_text, DOWN, aligned_edge=UR)
        maxCenter_text = Text(f"MaxCenter = {maxCenter}", font_size=24).next_to(maxLen_text, DOWN, aligned_edge=UR)

        self.play(Create(center_text), Create(right_text), Create(maxLen_text), Create(maxCenter_text))

        # Main Loop
        for i in range(1, n - 1):
            i_text = Text(f"i = {i}", font_size=24, color=RED).next_to(array_group, UP)
            self.play(Create(i_text))

            mirror = 2 * center - i
            mirror_text = Text(f"Mirror = {mirror}", font_size=20, color=YELLOW).next_to(i_text, DOWN, aligned_edge=LEFT)

            self.play(Create(mirror_text))

            if right > i:
                P[i] = min(right - i, P[mirror])
                self.play(Transform(p_array_group[i][1], Text(str(P[i]), font_size=24)))
                self.wait(0.5)

            self.play(FadeOut(mirror_text))

            # Expand palindrome
            j = 1
            while i + j < n and i - j >= 0 and processed_s[i + j] == processed_s[i - j]:
                P[i] += 1
                self.play(Transform(p_array_group[i][1], Text(str(P[i]), font_size=24)))

                self.play(array_group[i+j][0].animate.set_color(GREEN), array_group[i-j][0].animate.set_color(GREEN))
                self.wait(0.2)
                self.play(array_group[i+j][0].animate.set_color(WHITE), array_group[i-j][0].animate.set_color(WHITE))

                j += 1

            # Update center and right
            if i + P[i] > right:
                center = i
                right = i + P[i]

                self.play(Transform(center_text, Text(f"Center = {center}", font_size=24).to_corner(UR)))
                self.play(Transform(right_text, Text(f"Right = {right}", font_size=24).next_to(center_text, DOWN, aligned_edge=UR)))

            # Update maxLen and maxCenter
            if P[i] > maxLen:
                maxLen = P[i]
                maxCenter = i

                self.play(Transform(maxLen_text, Text(f"MaxLen = {maxLen}", font_size=24).next_to(right_text, DOWN, aligned_edge=UR)))
                self.play(Transform(maxCenter_text, Text(f"MaxCenter = {maxCenter}", font_size=24).next_to(maxLen_text, DOWN, aligned_edge=UR)))

            self.play(FadeOut(i_text))

        # Extract result
        start = (maxCenter - maxLen) // 2
        end = start + maxLen
        result = s[start:end]

        result_text = Text(f"Longest Palindrome: {result}", font_size=30, color=GREEN).to_edge(DOWN)
        self.play(Create(result_text))

        self.wait(3)