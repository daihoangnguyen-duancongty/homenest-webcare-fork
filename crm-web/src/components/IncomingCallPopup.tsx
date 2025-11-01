// components/IncomingCallPopup.tsx
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { styled } from "@mui/system";

interface IncomingCallPopupProps {
  guestName: string;
  callLink: string;
  onClose?: () => void;
}

const PopupContainer = styled(Box)(({ theme }) => ({
  position: "fixed",
  bottom: 20,
  right: 20,
  width: 280,
  backgroundColor: "#fff",
  borderRadius: 16,
  boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  zIndex: 3000,
  fontFamily: "sans-serif",
}));

const GuestName = styled(Typography)({
  fontWeight: 600,
  fontSize: "16px",
  marginBottom: 8,
});

const ButtonsWrapper = styled(Box)({
  display: "flex",
  gap: 8,
  marginTop: 12,
});

export default function IncomingCallPopup({ guestName, callLink, onClose }: IncomingCallPopupProps) {
  const handleAnswer = () => {
    window.open(callLink, "_blank");
    if (onClose) onClose();
  };

  return (
    <PopupContainer>
      <GuestName>{guestName}</GuestName>
      <Typography variant="body2" color="textSecondary">
        đang gọi đến...
      </Typography>
      <ButtonsWrapper>
        <Button variant="contained" color="success" onClick={handleAnswer} size="small">
          Nhận
        </Button>
        <Button variant="outlined" color="error" onClick={onClose} size="small">
          Từ chối
        </Button>
      </ButtonsWrapper>
    </PopupContainer>
  );
}
