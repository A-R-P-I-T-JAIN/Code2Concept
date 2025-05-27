from manim import *

class LongestPalindrome(Scene):
    def construct(self):
        title = Text("Longest Palindrome", font_size=24).to_corner(UL)
        self.add(title)

        s = "babad"
        n = len(s)

        # Create array visualization
        squares = VGroup(*[Square(side_length=1) for _ in range(n)])
        squares.arrange(RIGHT, buff=0.2)
        squares.move_to(ORIGIN)

        texts = VGroup(*[Text(char, font_size=36) for char in s])
        for i in range(n):
            texts[i].move_to(squares[i].get_center())

        array_group = VGroup(squares, texts)
        self.play(Create(squares), Write(texts))
        self.wait(0.5)

        # Variables display
        start_label = Text("Start: ", font_size=24).to_corner(UR)
        end_label = Text("End: ", font_size=24).next_to(start_label, DOWN, aligned_edge=UR)
        len_label = Text("Len: ", font_size=24).next_to(end_label, DOWN, aligned_edge=UR)
        max_len_label = Text("Max Len: ", font_size=24).next_to(len_label, DOWN, aligned_edge=UR)

        start_value = Text("0", font_size=24).next_to(start_label, RIGHT)
        end_value = Text("0", font_size=24).next_to(end_label, RIGHT)
        len_value = Text("0", font_size=24).next_to(len_label, RIGHT)
        max_len_value = Text("0", font_size=24).next_to(max_len_label, RIGHT)

        variables_group = VGroup(start_label, end_label, len_label, max_len_label,
                                 start_value, end_value, len_value, max_len_value).arrange(DOWN, aligned_edge=UR)
        self.play(Write(start_label), Write(end_label), Write(len_label), Write(max_len_label))
        self.play(Write(start_value), Write(end_value), Write(len_value), Write(max_len_value))

        # Iterate through the string
        for i in range(n):
            i_text = Text(f"i = {i}", font_size=24).to_edge(DOWN)
            self.play(Write(i_text))

            # Expand around center (i, i)
            left = i
            right = i
            len1 = 1

            l_pointer = Arrow(start=squares[left].get_center() + UP * 0.5, end=squares[left].get_center(), color=RED)
            r_pointer = Arrow(start=squares[right].get_center() + UP * 0.5, end=squares[right].get_center(), color=BLUE)

            self.play(Create(l_pointer), Create(r_pointer))
            while left > 0 and right < n - 1 and s[left - 1] == s[right + 1]:
                left -= 1
                right += 1
                len1 += 2

                self.play(
                    l_pointer.animate.move_to(squares[left].get_center() + UP * 0.5),
                    r_pointer.animate.move_to(squares[right].get_center() + UP * 0.5)
                )
                self.wait(0.25)

            self.play(FadeOut(l_pointer), FadeOut(r_pointer))

            # Expand around center (i, i + 1)
            left = i
            right = i + 1
            len2 = 0

            if i < n - 1:
                l_pointer = Arrow(start=squares[left].get_center() + UP * 0.5, end=squares[left].get_center(), color=RED)
                r_pointer = Arrow(start=squares[right].get_center() + UP * 0.5, end=squares[right].get_center(), color=BLUE)
                self.play(Create(l_pointer), Create(r_pointer))
                self.wait(0.25)

                while left >= 0 and right < n and s[left] == s[right]:
                    len2 += 2
                    if left == 0 or right == n -1:
                        break
                    left -= 1
                    right += 1
                    if left >= 0 and right < n and s[left] == s[right]:
                        self.play(
                            l_pointer.animate.move_to(squares[left].get_center() + UP * 0.5),
                            r_pointer.animate.move_to(squares[right].get_center() + UP * 0.5)
                        )
                        self.wait(0.25)
                    else:
                        if len2 == 0:
                            self.play(FadeOut(l_pointer), FadeOut(r_pointer))
                            break
                self.play(FadeOut(l_pointer), FadeOut(r_pointer))

            else:
                len2 = 0

            len_val = max(len1, len2)
            self.play(Transform(len_value, Text(str(len_val), font_size=24).next_to(len_label, RIGHT)))
            self.wait(0.25)

            current_start = int(start_value.text)
            current_end = int(end_value.text)
            max_len = current_end - current_start + 1

            if len_val > max_len:
                start = i - (len_val - 1) // 2
                end = i + len_val // 2
                self.play(Transform(start_value, Text(str(start), font_size=24).next_to(start_label, RIGHT)),
                          Transform(end_value, Text(str(end), font_size=24).next_to(end_label, RIGHT)),
                          Transform(max_len_value, Text(str(len_val), font_size=24).next_to(max_len_label, RIGHT)))
                self.wait(0.25)

            self.play(FadeOut(i_text))

        # Highlight the longest palindrome substring
        final_start = int(start_value.text)
        final_end = int(end_value.text)

        for i in range(final_start, final_end + 1):
            self.play(squares[i].animate.set_color(GREEN))
            self.wait(0.1)

        self.wait(2)