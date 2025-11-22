'use client';

import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import { Search, Circle, Edit, Send, AutoAwesome } from '@mui/icons-material';
import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  content: string;
  sentAt: string;
  readAt: string | null;
  sender: {
    name: string;
  };
}

interface MessageThread {
  id: string;
  subject: string;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  createdBy: {
    name: string;
  };
  messages: Message[];
}

interface MessagesContentProps {
  threads: MessageThread[];
}

export function MessagesContent({ threads }: MessagesContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    threads.length > 0 ? threads[0].id : null
  );
  const [replyText, setReplyText] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [responseType, setResponseType] = useState('general');

  const filteredThreads = threads.filter((thread) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      thread.subject.toLowerCase().includes(searchLower) ||
      thread.patient.firstName.toLowerCase().includes(searchLower) ||
      thread.patient.lastName.toLowerCase().includes(searchLower) ||
      thread.createdBy.name.toLowerCase().includes(searchLower)
    );
  });

  const selectedThread = filteredThreads.find((t) => t.id === selectedThreadId);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const hasUnreadMessages = (thread: MessageThread) => {
    return thread.messages.some((msg) => !msg.readAt);
  };

  const getUnreadCount = (thread: MessageThread) => {
    return thread.messages.filter((msg) => !msg.readAt).length;
  };

  const handleAIAssist = async () => {
    if (!selectedThread) return;

    setAiDialogOpen(true);
    setAiLoading(true);
    setAiSuggestions('');

    try {
      const lastMessage = selectedThread.messages[selectedThread.messages.length - 1];
      const messageHistory = selectedThread.messages.slice(-3).map(m =>
        `${m.sender.name}: ${m.content}`
      ).join('\n\n');

      const response = await fetch('/api/ai/message-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientMessage: lastMessage?.content || '',
          patientContext: `${selectedThread.patient.firstName} ${selectedThread.patient.lastName} - ${selectedThread.subject}`,
          messageHistory,
          responseType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response suggestions');
      }

      const data = await response.json();
      setAiSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error generating message response:', error);
      setAiSuggestions('Failed to generate response suggestions. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const useAISuggestion = (suggestion: string) => {
    setReplyText(suggestion);
    setAiDialogOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Messages</Typography>
        <Chip
          label={`${filteredThreads.length} Conversations`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Thread List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          <Paper sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
            {filteredThreads.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {searchTerm ? 'No conversations found.' : 'No messages yet.'}
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredThreads.map((thread, index) => (
                  <Box key={thread.id}>
                    <ListItemButton
                      selected={selectedThreadId === thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          '&:hover': {
                            bgcolor: 'primary.light',
                          },
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(thread.patient.firstName, thread.patient.lastName)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" fontWeight="medium">
                              {thread.patient.firstName} {thread.patient.lastName}
                            </Typography>
                            {hasUnreadMessages(thread) && (
                              <Chip
                                label={getUnreadCount(thread)}
                                size="small"
                                color="error"
                                sx={{ height: 20, minWidth: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" noWrap>
                              {thread.subject}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(thread.createdAt), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {index < filteredThreads.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Message Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          {!selectedThread ? (
            <Paper sx={{ p: 8, textAlign: 'center', height: '100%' }}>
              <Typography color="text.secondary">
                Select a conversation to view messages
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ height: 'calc(100vh - 250px)', display: 'flex', flexDirection: 'column' }}>
              {/* Thread Header */}
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    {getInitials(selectedThread.patient.firstName, selectedThread.patient.lastName)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {selectedThread.patient.firstName} {selectedThread.patient.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedThread.subject}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={`${selectedThread.messages.length} messages`}
                      size="small"
                      variant="outlined"
                    />
                    <Tooltip title="Edit Thread">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => router.push(`/messages/${selectedThread.id}/edit`)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
                {selectedThread.messages.length === 0 ? (
                  <Typography color="text.secondary" align="center">
                    No messages in this conversation yet
                  </Typography>
                ) : (
                  selectedThread.messages.map((message) => (
                    <Card
                      key={message.id}
                      sx={{
                        mb: 2,
                        bgcolor: message.readAt ? 'background.paper' : 'action.hover',
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {message.sender.name}
                            </Typography>
                            {!message.readAt && (
                              <Circle sx={{ fontSize: 8, color: 'error.main' }} />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(message.sentAt), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                        {message.readAt && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Read: {format(new Date(message.readAt), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>

              {/* Reply Section */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Paper sx={{ p: 2, mb: 1, bgcolor: 'info.50' }} elevation={0}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <AutoAwesome fontSize="small" color="secondary" />
                    <Typography variant="caption" color="text.secondary">
                      Use AI to draft professional responses
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      select
                      size="small"
                      value={responseType}
                      onChange={(e) => setResponseType(e.target.value)}
                      sx={{ minWidth: 150 }}
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="appointment">Appointment</MenuItem>
                      <MenuItem value="billing">Billing</MenuItem>
                      <MenuItem value="clinical">Clinical</MenuItem>
                    </TextField>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<AutoAwesome />}
                      onClick={handleAIAssist}
                      size="small"
                    >
                      AI Suggestions
                    </Button>
                  </Stack>
                </Paper>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    variant="outlined"
                  />
                  <Button
                    variant="contained"
                    endIcon={<Send />}
                    disabled={!replyText.trim()}
                    sx={{ minWidth: 100 }}
                  >
                    Send
                  </Button>
                </Stack>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* AI Response Suggestions Dialog */}
      <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoAwesome color="secondary" />
            <Typography variant="h6">AI Response Suggestions</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {aiLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Generating response suggestions...
              </Typography>
            </Box>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Click on a suggestion below to use it, or copy parts to create your own response.
              </Alert>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {aiSuggestions}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
