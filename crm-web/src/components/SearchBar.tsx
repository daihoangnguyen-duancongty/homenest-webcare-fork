import React, { useState } from "react";
import type { KeyboardEvent, ChangeEvent } from 'react';
import { alpha, styled } from "@mui/material/styles";
import { InputBase, Box, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

interface SearchBarProps {
  value: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  bgcolor?: string;
  radius?: number;
  autoFocus?: boolean;
  sx?: object;
}

const SearchWrapper = styled("div")<
  { bgcolor?: string; radius?: number; focused?: boolean }
>(({ theme, bgcolor, radius, focused }) => ({
  display: "flex",
  alignItems: "center",
  backgroundColor: bgcolor || alpha(theme.palette.grey[200], 0.9),
  borderRadius: radius || 24,
  padding: "4px 12px",
  transition: "all 0.2s ease",
  boxShadow: focused
    ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`
    : "none",
  "&:hover": {
    backgroundColor: alpha(theme.palette.grey[300], 0.9),
  },
}));

const StyledInput = styled(InputBase)(({ theme }) => ({
  flex: 1,
  fontSize: 15,
  color: theme.palette.text.primary,
  "& input": {
    padding: "6px 8px",
  },
}));

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  onSearch,
  placeholder = "Tìm kiếm...",
  leftIcon = <SearchIcon fontSize="small" />,
  rightIcon,
  bgcolor,
  radius,
  autoFocus = false,
  sx = {},
}) => {
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <SearchWrapper bgcolor={bgcolor} radius={radius} focused={focused} sx={sx}>
      {leftIcon && <Box sx={{ mr: 1, color: "text.secondary" }}>{leftIcon}</Box>}

      <StyledInput
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />

      {value ? (
        <IconButton
          size="small"
          onClick={() => onClear?.()}
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : (
        rightIcon && <Box sx={{ color: "text.secondary" }}>{rightIcon}</Box>
      )}
    </SearchWrapper>
  );
};

export default SearchBar;
