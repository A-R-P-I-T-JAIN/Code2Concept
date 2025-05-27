from manim import *

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class RemoveNthFromEnd(Scene):
    def construct(self):
        title = Text("Remove Nth Node From End", font_size=24).to_corner(UL)
        self.add(title)

        # Example input: 1 -> 2 -> 3 -> 4 -> 5, n = 2
        # Expected output: 1 -> 2 -> 3 -> 5

        values = [1, 2, 3, 4, 5]
        n = 2

        # Create ListNode objects
        nodes = [ListNode(val) for val in values]
        for i in range(len(nodes) - 1):
            nodes[i].next = nodes[i+1]

        head = nodes[0]

        # Manim representation of linked list
        rectangles = [Rectangle(width=1.0, height=1.0) for _ in values]
        texts = [Text(str(val), font_size=36).move_to(rect.get_center()) for val, rect in zip(values, rectangles)]
        arrows = [Arrow(rectangles[i].get_right(), rectangles[i+1].get_left(), buff=0.1) for i in range(len(rectangles) - 1)]

        group = VGroup(*[VGroup(rect, text) for rect, text in zip(rectangles, texts)])
        group.arrange(RIGHT, buff=1.0).move_to(ORIGIN)

        arrow_group = VGroup(*arrows)

        self.play(FadeIn(group, arrow_group))
        self.wait(1)

        # Calculate length of linked list
        length = len(values)
        length_text = MathTex(r"\text{length} = " + str(length)).to_corner(UR)
        self.play(FadeIn(length_text))
        self.wait(1)

        # Determine node to remove
        remove_index = length - n
        remove_index_text = MathTex(r"\text{remove index} = " + str(remove_index)).next_to(length_text, DOWN, aligned_edge=UR)
        self.play(FadeIn(remove_index_text))
        self.wait(1)

        # Special case: remove head
        if n == length:
            self.play(Indicate(rectangles[0], color=RED))
            self.play(FadeOut(rectangles[0], texts[0], arrows[0]))

            new_group = VGroup(*[VGroup(rectangles[i+1], texts[i+1]) for i in range(len(rectangles) - 1)])
            new_arrows = [Arrow(rectangles[i].get_right(), rectangles[i+1].get_left(), buff=0.1) for i in range(len(rectangles) - 1)]

            new_group.arrange(RIGHT, buff=1.0).move_to(ORIGIN)
            arrow_group = VGroup(*new_arrows)

            self.play(new_group.animate.move_to(ORIGIN), FadeIn(arrow_group))
            self.wait(2)
            self.play(FadeOut(new_group, arrow_group, length_text, remove_index_text))
            return

        # Traverse to node before the one to remove
        current_index = 0
        current_pointer = Arrow(UP, rectangles[0].get_bottom(), color=RED)
        current_text = Text("Current", font_size=24).next_to(current_pointer, LEFT)
        self.play(FadeIn(current_pointer, current_text))
        self.wait(1)

        for i in range(remove_index):
            current_index += 1
            self.play(
                current_pointer.animate.move_to(rectangles[i+1].get_bottom()),
                Transform(current_text, Text("Current", font_size=24).next_to(current_pointer, LEFT))
            )
            self.wait(1)

        # Remove the nth node from the end
        self.play(Indicate(rectangles[remove_index], color=RED))
        self.play(FadeOut(rectangles[remove_index], texts[remove_index]))

        if remove_index < len(values) -1:
            self.play(Transform(arrows[remove_index-1], Arrow(rectangles[remove_index-1].get_right(), rectangles[remove_index+1].get_left(), buff=0.1)))
        self.wait(1)
        
        self.play(FadeOut(current_pointer, current_text, length_text, remove_index_text))
        self.wait(2)