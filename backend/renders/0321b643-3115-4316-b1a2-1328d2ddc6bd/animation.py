from manim import *

class DummyAlgorithm(Scene):
    def construct(self):
        # Example Input (Simple Number Line)
        number_line = NumberLine(x_range=[-5, 5, 1], length=10)
        self.play(Create(number_line))

        # Key Point 1: Show 0
        zero_point = Dot(number_line.number_to_point(0), color=GREEN)
        zero_label = Tex("0", font_size=36).next_to(zero_point, DOWN)
        self.play(FadeIn(zero_point, zero_label))
        self.wait(1)

        # Key Point 2: Show 1
        one_point = Dot(number_line.number_to_point(1), color=BLUE)
        one_label = Tex("1", font_size=36).next_to(one_point, DOWN)
        self.play(FadeIn(one_point, one_label))
        self.wait(1)

        # Key Point 3: Highlight Distance
        brace = BraceBetweenPoints(number_line.number_to_point(0), number_line.number_to_point(1), direction=DOWN)
        distance_label = brace.get_text("Distance = 1", font_size=30)
        self.play(Create(brace), Write(distance_label))
        self.wait(2)

        # Summary
        summary_text = Tex("Algorithm Complete (Dummy)", font_size=48).to_edge(UP)
        self.play(Write(summary_text))
        self.wait(2)

        self.play(FadeOut(number_line, zero_point, zero_label, one_point, one_label, brace, distance_label, summary_text))

class AnotherDummy(Scene):
    def construct(self):
        # Visual elements
        rect1 = Rectangle(width=1, height=1, color=BLUE)
        rect2 = Rectangle(width=1, height=1, color=GREEN).next_to(rect1, RIGHT)
        text1 = Text("A", font_size=36).move_to(rect1.get_center())
        text2 = Text("B", font_size=36).move_to(rect2.get_center())

        group = VGroup(rect1, rect2, text1, text2).move_to(ORIGIN)

        # Initial display
        self.play(Create(group))
        self.wait(1)

        # Animation: Highlight
        self.play(rect1.animate.set_fill(YELLOW, opacity=0.5), run_time=1)
        self.wait(0.5)
        self.play(rect1.animate.set_fill(BLUE, opacity=0), run_time=1) # Revert color

        # Animation: Move
        arrow = Arrow(rect1.get_center(), UP * 2)
        label = Text("Processing", font_size=30).next_to(arrow, UP)
        self.play(Create(arrow), Write(label))
        self.wait(1)
        self.play(FadeOut(arrow, label))

        # Animation: Change text
        new_text1 = Text("C", font_size=36).move_to(rect1.get_center())
        self.play(Transform(text1, new_text1))
        self.wait(1)

        # Final state
        self.play(group.animate.shift(DOWN * 2))
        self.wait(2)