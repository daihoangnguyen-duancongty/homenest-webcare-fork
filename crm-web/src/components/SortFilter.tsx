//
import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  Tooltip,
 
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import ClearAllIcon from "@mui/icons-material/ClearAll";

// Định nghĩa kiểu cho filter options
export interface FilterOption {
  label: string;
  value: string;
}

// Props cho component
interface SortFilterProps {
  filters?: FilterOption[];
  selectedFilter?: string;
  sortOrder?: "asc" | "desc";
  onFilterChange?: (value: string) => void;
  onSortChange?: (order: "asc" | "desc") => void;
  onClear?: () => void;
  showSort?: boolean;
  sx?: object;
}

const SortFilter: React.FC<SortFilterProps> = ({
  filters = [
    { label: "User Name", value: "username" },
    { label: "User Label", value: "label" },
  ],
  selectedFilter = "",
  sortOrder = "asc",
  onFilterChange = () => {},
  onSortChange = () => {},
  onClear = () => {},
  showSort = true,
  sx = {},
}) => {
  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    onFilterChange(event.target.value);
  };

  const handleSortToggle = () => {
    onSortChange(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1,
      
        borderRadius: 3,
        // bgcolor: "background.paper",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        transition: "all 0.3s ease",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
        ...sx,
      }}
    >
      {/* Dropdown chọn filter */}
      <FormControl size="small" sx={{ minWidth: 150,bgcolor: "background.paper",borderRadius:2 }}>
        <InputLabel sx={{ fontWeight: 500 }}>Lọc theo</InputLabel>
        <Select
          value={selectedFilter}
          label="Lọc theo"
          onChange={handleFilterChange}
          sx={{
            borderRadius: 2,
            "& .MuiSelect-select": { display: "flex", alignItems: "center" },
          }}
        >
          {filters.map((filter) => (
            <MenuItem key={filter.value} value={filter.value}>
              {filter.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Sort order toggle */}
      {showSort && (
        <Tooltip title={`Sắp xếp ${sortOrder === "asc" ? "tăng dần" : "giảm dần"}`}>
          <IconButton
            size="small"
            onClick={handleSortToggle}
            sx={{
              bgcolor: "background.default",
              borderRadius: 2,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <SortIcon
              sx={{
                transform: sortOrder === "asc" ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.3s ease",
              }}
            />
          </IconButton>
        </Tooltip>
      )}

      {/* Hiển thị filter đang chọn */}
      {selectedFilter && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            label={filters.find((f) => f.value === selectedFilter)?.label}
            variant="outlined"
            color="primary"
            size="small"
          />
        </Stack>
      )}

      {/* Nút clear */}
      <Tooltip title="Xóa lọc">
        <IconButton
          size="small"
          onClick={onClear}
          sx={{
            bgcolor: "background.default",
            borderRadius: 2,
            "&:hover": { bgcolor: "error.light", color: "white" },
          }}
        >
          <ClearAllIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default SortFilter;
