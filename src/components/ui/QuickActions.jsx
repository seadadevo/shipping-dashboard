import React from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
} from "@mui/material";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

export default function QuickActions() {
  const actions = [
    { label: "إدارة المستخدمين", icon: <PeopleAltOutlinedIcon /> },
    { label: "إدارة الطلبات", icon: <Inventory2OutlinedIcon />, active: true },
    { label: "تقارير الأداء", icon: <ShowChartOutlinedIcon /> },
    { label: "تتبع المركبات", icon: <LocalShippingOutlinedIcon /> },
  ];

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 3,
        width: 300,
        textAlign: "right",
        direction: "rtl",
      }}
    >
      <Typography variant="h6" fontWeight="600" mb={0.5}>
        الإجراءات السريعة
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        الوصول السريع للمهام الأساسية
      </Typography>

      <Stack spacing={1}>
        {actions.map((item, index) => (
          <Button
            key={index}
            variant={item.active ? "contained" : "outlined"}
            color={item.active ? "inherit" : "primary"}
            sx={{
              justifyContent: "space-between",
              color: "text.primary",
              bgcolor: item.active ? "#f3f4f6" : "transparent",
              borderColor: "#ddd",
              "&:hover": { bgcolor: "#f3f4f6", borderColor: "#ccc" },
              textTransform: "none",
              fontWeight: 500,
            }}
            endIcon={item.icon}
          >
            {item.label}
          </Button>
        ))}
      </Stack>
    </Paper>
  );
}
