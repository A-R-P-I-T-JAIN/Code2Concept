from manim import *

class AlgorithmDemo(Scene):
    def construct(self):
        # Narration steps
        steps = [
            "Initialize the N-Queens board with empty cells represented by dots.",
            "Start the backtracking search from the first row at index zero.",
            "Check if all queens are successfully placed once we reach the final row.",
            "Add the current valid board configuration to the final results list.",
            "Iterate through each column in the current row to find a safe spot.",
            "Verify if placing a queen at the current position is safe from attacks.",
            "Check vertically above and along both diagonals for any existing queens.",
            "Place a queen at the safe position and mark the cell with Q.",
            "Recursively move to the next row to place the remaining queens.",
            "Backtrack by removing the queen and resetting the cell to a dot for other paths."
        ]

        # Status text at the top left
        status = Text(steps[0], font_size=20, color=YELLOW)
        status.to_edge(UP + LEFT)
        self.play(Write(status))

        # Title
        title = Text("N-Queens Backtracking Algorithm", font_size=28, color=BLUE)
        title.to_edge(UP + RIGHT)
        self.play(Write(title))
        self.wait(1)

        # Create a 4x4 board representation
        n = 4
        board_group = VGroup()
        squares = []
        texts = []

        cell_size = 0.9
        for r in range(n):
            row_squares = []
            row_texts = []
            for c in range(n):
                sq = Square(side_length=cell_size)
                sq.set_fill(DARK_GRAY, opacity=0.6)
                sq.set_stroke(WHITE, width=1)
                sq.shift(RIGHT * (c - n/2 + 0.5) * cell_size + DOWN * (r - n/2 + 0.5) * cell_size)
                
                txt = Text(".", font_size=32, color=WHITE)
                txt.move_to(sq.get_center())
                
                row_squares.append(sq)
                row_texts.append(txt)
                board_group.add(sq, txt)
            squares.append(row_squares)
            texts.append(row_texts)

        board_group.move_to(ORIGIN + DOWN * 0.5)
        
        # Step 1: Initialize board
        self.play(FadeIn(board_group))
        self.wait(1)

        # Step 2: Start search from row 0
        self.play(Transform(status, Text(steps[1], font_size=20, color=YELLOW).to_edge(UP + LEFT)))
        self.play(squares[0][0].animate.set_stroke(BLUE, width=3))
        self.wait(1)

        # Step 3 & 4: Check row == n / add result concept (simulate finding a partial state)
        self.play(Transform(status, Text(steps[2], font_size=20, color=YELLOW).to_edge(UP + LEFT)))
        self.wait(1)
        self.play(Transform(status, Text(steps[3], font_size=20, color=YELLOW).to_edge(UP + LEFT)))
        self.wait(1)

        # Step 4: Iterate columns & check safety
        self.play(Transform(status, Text(steps[4], font_size=20, color=YELLOW).to_edge(UP + LEFT)))
        self.play(squares[0][1].animate.set_stroke(BLUE, width=3))
        self.wait(1)

        self.play(Transform(status, Text(steps[5], font_size=20, color=YELLOW).to_edge(UP + LEFT)))
        self.wait(1)

        self.play(Transform(status, Text(steps[6], font_size=20, color=YELLOW).to_edge(UP + LEFT)))
        self.wait(1)

        # Step 7 & 8: Place Queen at (0, 1) - actually 0,0 for standard valid 4-queens configuration: [1, 3, 0, 2]
        # Let's place Q at (0, 1) for demonstration of the step
        self.play(Transform(status, Text(steps[7], font_size=20, color=YELLOW).to_edge(UP + LEFT)))
        self.play(
            Transform(texts[0][1], Text("Q", font_size=28, color=GREEN).move_to(squares[0][1].get_center())),
            squares[0][1].animate.set_fill(GREEN, opacity=0.3)
        )
        self.wait(1)

        # Step 8: Recurse to next row
        self.play(Transform(status, Text(steps[8], font_size=20, color=YELLOW).to_edge(UP + LEFT)))
        self.play(squares[1][3].animate.set_stroke(PURPLE, width=3))
        self.wait(1)

        # Step 9: Backtrack example
        self.play(Transform(status, Text(steps[9], font_size=20, color=YELLOW).to_edge(UP + LEFT)))
        self.play(
            Transform(texts[0][1], Text(".", font_size=32, color=WHITE).move_to(squares[0][1].get_center())),
            squares[0][1].animate.set_fill(DARK_GRAY, opacity=0.6).set_stroke(WHITE, width=1)
        ),
        self.play(squares[1][3].animate.set_stroke(WHITE, width=1))
        self.wait(1)

        # Final successful configuration display for N-Queens (0->1, 1->3, 2->0, 3->2)
        final_queens = [(0, 1), (1, 3), (2, 0), (3, 2)]
        anim_list = []
        for r, c in final_queens:
            anim_list.append(Transform(texts[r][c], Text("Q", font_size=28, color=GREEN).move_to(squares[r][c].get_center())))
            anim_list.append(squares[r][c].animate.set_fill(GREEN, opacity=0.4))

        success_status = Text("Found Valid N-Queens Solution!", font_size=22, color=GREEN).to_edge(UP + LEFT)
        self.play(Transform(status, success_status))
        self.play(*anim_list)
        self.wait(2)