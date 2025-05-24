from manim import *

class ApproachTitle(Scene):
    def construct(self):
        title = Text("Binary Search", font_size=24)
        title.to_corner(UL)
        self.play(Write(title))
        self.wait(1)


class BinarySearchVisualization(Scene):
    def construct(self):
        self.add(Text("Binary Search", font_size=24).to_corner(UL))

        # Example sorted array
        arr = [2, 5, 7, 8, 11, 12]
        target = 13  # Target value not in the array

        # Create array elements
        rects = []
        texts = []
        for i, num in enumerate(arr):
            rect = Rectangle(width=1.0, height=1.0)
            text = Text(str(num), font_size=36).move_to(rect.get_center())
            rects.append(rect)
            texts.append(text)

        array_group = VGroup(*rects).arrange(RIGHT, buff=0.5).move_to(ORIGIN)
        text_group = VGroup(*texts).arrange(RIGHT, buff=0.5).move_to(ORIGIN)

        self.play(Create(array_group), Write(text_group))
        self.wait(0.5)

        # Initialize pointers
        left = 0
        right = len(arr) - 1
        mid = (left + right) // 2

        left_pointer = Arrow(start=array_group[left].get_edge(DOWN) + DOWN * 0.2,
                                end=array_group[left].get_edge(DOWN), color=RED, buff=0)
        left_label = Text("left", color=RED, font_size=24).next_to(left_pointer, DOWN)

        right_pointer = Arrow(start=array_group[right].get_edge(DOWN) + DOWN * 0.2,
                                 end=array_group[right].get_edge(DOWN), color=BLUE, buff=0)
        right_label = Text("right", color=BLUE, font_size=24).next_to(right_pointer, DOWN)

        mid_pointer = Arrow(start=array_group[mid].get_edge(UP) + UP * 0.2,
                               end=array_group[mid].get_edge(UP), color=GREEN, buff=0)
        mid_label = Text("mid", color=GREEN, font_size=24).next_to(mid_pointer, UP)


        self.play(Create(left_pointer), Write(left_label),
                  Create(right_pointer), Write(right_label),
                  Create(mid_pointer), Write(mid_label))
        self.wait(0.5)

        target_text = Text(f"Target = {target}", font_size=36).to_corner(UR)
        self.play(Write(target_text))

        # Binary Search iterations
        while left <= right:
            mid = (left + right) // 2
            self.play(
                mid_pointer.animate.move_to(array_group[mid].get_edge(UP) + UP * 0.2),
                mid_label.animate.next_to(mid_pointer, UP)
            )
            self.wait(0.3)

            # Comparison
            if arr[mid] == target:
                self.play(Flash(array_group[mid], color=YELLOW, flash_radius=0.5))
                result_text = Text("Target found!", color=GREEN, font_size=36).to_edge(DOWN)
                self.play(Write(result_text))
                self.wait(1)
                return  # Exit if found
            elif arr[mid] < target:
                self.play(Flash(array_group[mid], color=RED, flash_radius=0.5))
                self.wait(0.3)
                left = mid + 1
                self.play(
                    left_pointer.animate.move_to(array_group[left].get_edge(DOWN) + DOWN * 0.2),
                    left_label.animate.next_to(left_pointer, DOWN)
                )
                self.wait(0.5)
            else:
                self.play(Flash(array_group[mid], color=RED, flash_radius=0.5))
                self.wait(0.3)
                right = mid - 1
                self.play(
                    right_pointer.animate.move_to(array_group[right].get_edge(DOWN) + DOWN * 0.2),
                    right_label.animate.next_to(right_pointer, DOWN)
                )
                self.wait(0.5)

        # Target not found
        result_text = Text("Target not found.", color=RED, font_size=36).to_edge(DOWN)
        self.play(Write(result_text))
        self.wait(2)