import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
} from "@mui/material";

export interface LabelDialogProps {
  open: boolean;
  onClose: () => void;
  selectedConversation?: { userId: string; name?: string };
  availableLabels: string[];
  setAvailableLabels: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: (label: string) => void;
}

const LabelDialog: React.FC<LabelDialogProps> = ({
  open,
  onClose,
  selectedConversation,
  availableLabels,
  setAvailableLabels,
  onSave,
}) => {
  const [selectedLabel, setSelectedLabel] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const handleAddNewLabel = () => {
    if (newLabel.trim() && !availableLabels.includes(newLabel.trim())) {
      setAvailableLabels((prev) => [...prev, newLabel.trim()]);
      setSelectedLabel(newLabel.trim());
      setNewLabel("");
    }
  };

  const handleSave = () => {
    if (!selectedConversation || !selectedLabel) return;
    onSave(selectedLabel);
    setSelectedLabel("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: "linear-gradient(135deg, #f5f7fa 0%, #e4ecfa 100%)",
          boxShadow:
            "0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)",
        },
      }}
      sx={{ zIndex: 2600 }}
    >
      <DialogTitle
        sx={{
          fontWeight: 600,
          background:
            "linear-gradient(90deg, #0078ff 0%, #8a2be2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "1.2rem",
        }}
      >
        Gắn nhãn cho hội thoại
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Chọn hoặc thêm nhãn mới cho{" "}
            <strong style={{ color: "#444" }}>
              {selectedConversation?.name || "người dùng"}
            </strong>
          </Typography>

          {/* Chọn nhãn có sẵn */}
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Chọn nhãn</InputLabel>
            <Select
              value={selectedLabel}
              label="Chọn nhãn"
              onChange={(e) => setSelectedLabel(e.target.value)}
              sx={{
                borderRadius: 3,
                backgroundColor: "white",
                "&:hover": { backgroundColor: "#f9f9ff" },
              }}
            >
              {availableLabels.map((label) => (
                <MenuItem key={label} value={label}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Thêm nhãn mới */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              variant="outlined"
              size="small"
              fullWidth
              placeholder="Nhập nhãn mới..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  backgroundColor: "white",
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddNewLabel}
              sx={{
                background:
                  "linear-gradient(135deg, #0078ff 0%, #8a2be2 100%)",
                color: "#fff",
                borderRadius: 3,
                fontWeight: 600,
                textTransform: "none",
                px: 3,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #0066e0 0%, #7a1fd4 100%)",
                },
              }}
            >
              Thêm
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            borderRadius: 3,
            px: 2.5,
            color: "#555",
          }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            background:
              "linear-gradient(135deg, #0078ff 0%, #8a2be2 100%)",
            color: "#fff",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 3,
            px: 3,
            "&:hover": {
              background:
                "linear-gradient(135deg, #0066e0 0%, #7a1fd4 100%)",
            },
          }}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabelDialog;
