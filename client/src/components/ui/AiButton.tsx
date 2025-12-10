import { Button, createTheme, ThemeProvider } from "@mui/material";
import { styled, keyframes } from "@mui/system";
import { NavLink } from "react-router-dom";

// --- 1. Define Keyframes for the Color Movement ---

// This animation rotates a custom CSS variable to move the gradient along the border.
const colorCycle = keyframes`
  from {
    --angle: 0deg;
  }
  to {
    --angle: 360deg;
  }
`;

// --- 2. Create the Styled Button Component ---

const AnimatedBorderButton = styled(Button)(({ theme }) => {
  return {
    borderRadius: "50px", // Fully rounded corners
    padding: "4px 24px",
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    border: "2px solid transparent", // Crucial: creates space for the gradient
    position: "relative",
    zIndex: 1,
    overflow: "hidden",

    // Initialize the custom CSS variable
    "--angle": "0deg",

    // The dual-background technique:
    // 1. Solid color for the inside (padding-box)
    // 2. Conic gradient for the border area (border-box)
    background: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box,
                 conic-gradient(from var(--angle), #4285F4, #0F9D58, #F4B400, #DB4437, #4285F4) border-box`,
    backgroundSize: "100% 100%",
    backgroundOrigin: "padding-box, border-box",

    // Apply the animation to the background colors
    animation: `${colorCycle} 3s linear infinite forwards`, // Continuous loop

    // Ensure the button itself does not physically rotate
    transform: "rotate(0deg)",

    "&:hover": {
      // Prevents MUI default hover background color
      backgroundColor: theme.palette.background.paper,
      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
      // Optional: Speed up the animation on hover
      animationDuration: "1.5s",
    },
  };
});

// --- 3. Main Application Component (with ThemeProvider) ---

// Create a default MUI theme instance to ensure theme context exists
const defaultTheme = createTheme();

const AiButton = () => {
  return (
    // Must wrap in ThemeProvider for MUI palette values to be defined
    <ThemeProvider theme={defaultTheme}>
      <NavLink
        to="/ai-mode"
        style={{ display: "flex", justifyContent: "center" }}
        // onClick={() => {
        //   navigate("/ai-mode");
        // }}
      >
        <AnimatedBorderButton variant="outlined">AI Mode</AnimatedBorderButton>
      </NavLink>
    </ThemeProvider>
  );
};

export default AiButton;
