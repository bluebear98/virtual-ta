import { ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  Container, 
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Box
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const router = useRouter();
  const currentView = router.pathname === '/professor' ? 'professor' : 'student';

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: string | null) => {
    if (newView) {
      router.push(newView === 'professor' ? '/professor' : '/');
    }
  };

  return (
    <>
      <Head>
        <title>Virtual TA - {title}</title>
        <meta name="description" content="Analyze lecture transcripts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap" />
      </Head>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ 
            fontFamily: 'Orbitron',
            fontWeight: 700,
            letterSpacing: 1
          }}>
            {title}
          </Typography>
          <ToggleButtonGroup
            value={currentView}
            exclusive
            onChange={handleViewChange}
            aria-label="view mode"
          >
            <ToggleButton value="student" aria-label="student view">
              <PersonIcon sx={{ mr: 1 }} />
              Student
            </ToggleButton>
            <ToggleButton value="professor" aria-label="professor view">
              <SchoolIcon sx={{ mr: 1 }} />
              Professor
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {children}
      </Container>
    </>
  );
}
