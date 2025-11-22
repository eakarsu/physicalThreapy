'use client';

import { Box, Typography, Paper } from '@mui/material';

interface ComingSoonProps {
  title: string;
  description: string;
  features: string[];
}

export function ComingSoon({ title, description, features }: ComingSoonProps) {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      <Paper sx={{ p: 4, mt: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Features to include:
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          component="div"
          sx={{ mt: 1 }}
        >
          {features.map((feature, index) => (
            <div key={index}>• {feature}</div>
          ))}
        </Typography>
      </Paper>
    </Box>
  );
}
