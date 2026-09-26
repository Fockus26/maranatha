"use client";

import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { IconButton, type IconButtonProps } from "@mui/material";
import { useColorMode } from "@/theme/ThemeRegistry";

type ThemeToggleProps = {
  size?: IconButtonProps["size"];
  /**
   * Override de estilos — usado por DashboardSidebar/MobileMenuOverlay para
   * ajustar el color del ícono cuando el toggle vive sobre un fondo navy
   * permanente que no sigue el modo claro/oscuro (D024/D025).
   */
  sx?: IconButtonProps["sx"];
};

export default function ThemeToggle({ size = "small", sx }: ThemeToggleProps) {
  const { mode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      onClick={toggleColorMode}
      size={size}
      aria-label={
        mode === "light" ? "Activar modo oscuro" : "Activar modo claro"
      }
      sx={[
        {
          color: "text.secondary",
          borderRadius: "16px",
          transition: (theme) =>
            theme.transitions.create(["transform", "background-color"], {
              duration: theme.transitions.duration.short,
            }),
          "&:hover": {
            backgroundColor: "action.hover",
            transform: "rotate(20deg)",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {mode === "light" ? (
        <DarkModeOutlinedIcon
          fontSize={size === "large" ? "medium" : "small"}
        />
      ) : (
        <LightModeOutlinedIcon
          fontSize={size === "large" ? "medium" : "small"}
        />
      )}
    </IconButton>
  );
}
