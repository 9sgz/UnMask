import { SecurityScanner } from '@/components/SecurityScanner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="absolute top-6 right-6 z-10">
        <Button 
          onClick={() => navigate('/dashboard')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Ver Dashboard
        </Button>
      </div>
      <SecurityScanner />
    </div>
  );
};

export default Index;
