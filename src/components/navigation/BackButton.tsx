import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
  showIcon?: boolean;
  variant?: "default" | "ghost" | "outline";
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  label = "Back",
  showIcon = true,
  variant = "outline",
  className = ""
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handleClick}
      className={className}
    >
      {showIcon && <ArrowLeft className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  );
};
