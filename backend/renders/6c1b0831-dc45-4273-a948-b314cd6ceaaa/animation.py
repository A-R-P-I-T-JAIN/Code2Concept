from manim import *

class AlgorithmDemo(Scene):
    def construct(self):
        # 1. Title and Narration Setup
        title = Text("N-Queens Backtracking Algorithm", font_size=32).to_edge(UP)
        self.play(Write(title))

        narration_texts = [
            "Initialize an empty chessboard and prepare to place the first queen.",
            "Start the backtracking search from the first row.",
            "Check each column in the current row to find a safe position.",
            "Verify if placing a queen here conflicts with any existing queens.",
            "No conflicts found, so place the queen on the board.",
            "Move to the next row to place the subsequent queen.",
            "All queens are successfully placed, so save this valid board configuration.",
            "Backtrack by removing the queen to explore alternative positions.",
            "Try the next column option to find another valid arrangement."
        ]

        status = Text(narration_texts[0], font_size=20, color=YELLOW).to_edge(DOWN)
        self.play(Write(status))

        # 2. Create Chessboard (N=4)
        n = 4
        board_group = VGroup()
        squares = []
        cell_size = 0.9

        for r in range(n):
            row_squares = []
            for c in range(n):
                sq = Square(side_length=cell_size)
                sq.set_fill(WHITE if (r + c) % 2 == 0 else BLUE_E, opacity=0.3)
                sq.set_stroke(WHITE, 1)
                sq.move_to(np.array([(c - n/2 + 0.5) * cell_size, (n/2 - r - 0.5) * cell_size, 0]))
                row_squares.append(sq)
                board_group.add(sq)
            squares.append(row_squares)

        board_group.move_to(ORIGIN + DOWN * 0.3)
        self.play(Create(board_group))
        self.wait(1)

        # Helper to update status
        def update_status(idx):
            new_status = Text(narration_texts[idx], font_size=20, color=YELLOW).to_edge(DOWN)
            return Transform(status, new_status)

        # Helper to place/remove queen graphics
        queens = {}

        def place_queen(r, c):
            q = Text("Q", font_size=36, color=RED).move_to(squares[r][c].get_center())
            self.play(Write(q))
            queens[(r, c)] = q

        def remove_queen(r, c):
            q = queens.pop((r, c))
            self.play(FadeOut(q))

        # --- Walkthrough Simulation for N=4 ---
        
        # Step 1 & 2 & 3: Row 0
        self.play(update_status(1))
        self.wait(1)
        self.play(update_status(2))
        
        # Highlight Row 0, Col 0
        self.play(squares[0][0].animate.set_fill(YELLOW, opacity=0.6))
        self.play(update_status(3))
        self.wait(1)
        
        # Safe -> Place Q at (0, 0)
        self.play(update_status(4))
        place_queen(0, 0)
        self.play(squares[0][0].set_fill(WHITE, opacity=0.3))

        # Step 5: Move to Row 1
        self.play(update_status(5))
        self.wait(1)

        # Row 1, Col 0 (Conflict)
        self.play(squares[1][0].animate.set_fill(RED, opacity=0.6))
        self.play(update_status(3))
        self.wait(1)
        self.play(squares[1][0].set_fill(BLUE_E, opacity=0.3))

        # Row 1, Col 1 (Conflict)
        self.play(squares[1][1].animate.set_fill(RED, opacity=0.6))
        self.wait(1)
        self.play(squares[1][1].set_fill(WHITE, opacity=0.3))

        # Row 1, Col 2 (Safe)
        self.play(squares[1][2].animate.set_fill(YELLOW, opacity=0.6))
        self.wait(1)
        self.play(update_status(4))
        place_queen(1, 2)
        self.play(squares[1][2].set_fill(BLUE_E, opacity=0.3))

        # Step 5: Move to Row 2
        self.play(update_status(5))
        self.wait(1)

        # Row 2, Col 0 (Conflict)
        self.play(squares[2][0].animate.set_fill(RED, opacity=0.6))
        self.wait(1)
        self.play(squares[2][0].set_fill(WHITE, opacity=0.3))

        # Row 2, Col 1 (Conflict)
        self.play(squares[2][1].animate.set_fill(RED, opacity=0.6))
        self.wait(1)
        self.play(squares[2][1].set_fill(BLUE_E, opacity=0.3))

        # Row 2, Col 2 (Conflict)
        self.play(squares[2][2].animate.set_fill(RED, opacity=0.6))
        self.wait(1)
        self.play(squares[2][2].set_fill(WHITE, opacity=0.3))

        # Row 2, Col 3 (Conflict)
        self.play(squares[2][3].animate.set_fill(RED, opacity=0.6))
        self.wait(1)
        self.play(squares[2][3].set_fill(BLUE_E, opacity=0.3))

        # Step 7 & 8: Backtrack from Row 2
        self.play(update_status(7))
        remove_queen(1, 2)
        self.wait(1)

        # Step 8: Try next column in Row 1 (Col 3)
        self.play(update_status(8))
        self.play(squares[1][3].animate.set_fill(YELLOW, opacity=0.6))
        self.wait(1)
        place_queen(1, 3)
        self.play(squares[1][3].set_fill(WHITE, opacity=0.3))

        # Move to Row 2, find safe at Col 1
        self.play(update_status(5))
        self.play(squares[2][0].animate.set_fill(RED, opacity=0.6))
        self.wait(0.5)
        self.play(squares[2][0].set_fill(BLUE_E, opacity=0.3))

        self.play(squares[2][1].animate.set_fill(YELLOW, opacity=0.6))
        self.wait(1)
        place_queen(2, 1)
        self.play(squares[2][1].set_fill(WHITE, opacity=0.3))

        # Move to Row 3, find safe at Col 2
        self.play(update_status(5))
        self.play(squares[3][0].animate.set_fill(RED, opacity=0.6))
        self.wait(0.5)
        self.play(squares[3][0].set_fill(WHITE, opacity=0.3))

        self.play(squares[3][1].animate.set_fill(RED, opacity=0.6))
        self.wait(0.5)
        self.play(squares[3][1].set_fill(BLUE_E, opacity=0.3))

        self.play(squares[3][2].animate.set_fill(YELLOW, opacity=0.6))
        self.wait(1)
        place_queen(3, 2)
        self.play(squares[3][2].set_fill(WHITE, opacity=0.3))

        # Step 6: Success!
        final_success_text = Text("All queens successfully placed! Solution found.", font_size=20, color=GREEN).to_edge(DOWN)
        self.play(Transform(status, final_success_text))
        
        # Highlight all queens in Green
        for pos, q in queens.items():
            self.play(q.animate.set_color(GREEN), run_time=0.2)

        self.wait(2)