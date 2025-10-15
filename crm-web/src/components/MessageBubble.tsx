import { Box, Typography, Avatar } from '@mui/material';

interface MessageBubbleProps {
  text: string;
  username: string;
  avatar?: string | null;
  fromAdmin?: boolean;
  isOnline?: boolean;
  align?: 'left' | 'right';
  bubbleColor?: string;
}

export default function MessageBubble({
  text,
  username,
  avatar,
  fromAdmin = false,
  isOnline = false,
  align = fromAdmin ? 'left' : 'right',
  bubbleColor = fromAdmin ? '#007bff' : '#ffffff',
}: MessageBubbleProps) {
  return (
    <Box
      display="flex"
      flexDirection={align === 'left' ? 'row' : 'row-reverse'}
      alignItems="flex-start"
      mb={1.5}
      gap={1}
    >
      {/* Avatar + trạng thái online */}
      <Box position="relative">
        <Avatar
          src={avatar ?? undefined} // fix TypeScript không nhận null
          sx={{ width: 36, height: 36 }}
        >
          {!avatar && username.charAt(0).toUpperCase()} {/* fallback chữ cái đầu */}
        </Avatar>
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: isOnline ? 'green' : 'grey.400',
            border: '2px solid white',
          }}
        />
      </Box>

      {/* Bubble */}
      <Box
        sx={{
          maxWidth: '60%',
          p: 1.5,
          borderRadius: 2,
          bgcolor: bubbleColor,
          color: fromAdmin ? 'white' : 'black',
          wordBreak: 'break-word',
        }}
      >
        <Typography variant="caption" fontWeight="bold">
          {username}
        </Typography>
        <Typography variant="body2">{text}</Typography>
      </Box>
    </Box>
  );
}
