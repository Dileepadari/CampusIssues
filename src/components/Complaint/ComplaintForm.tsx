
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComplaintCategory } from '@/lib/types';

const ComplaintForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ComplaintCategory,
    isAnonymous: false,
  });
  const [files, setFiles] = useState<FileList | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value as ComplaintCategory,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isAnonymous: checked,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // This is a mock form submission for demonstration
      // In a real app, this would connect to your Spring Boot backend
      console.log('Complaint submitted:', formData);
      if (files) {
        console.log('Files to upload:', Array.from(files).map(f => f.name));
      }
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate a mock tracking ID
      const trackingId = `TRK${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Navigate to success screen with tracking ID
      navigate('/dashboard', { 
        state: { 
          success: true, 
          message: `Your complaint has been submitted successfully! Tracking ID: ${trackingId}` 
        } 
      });
    } catch (err) {
      setError('Failed to submit complaint. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const categories: Array<{ value: ComplaintCategory; label: string }> = [
    { value: 'academics', label: 'Academics' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'canteen', label: 'Canteen' },
    { value: 'transport', label: 'Transport' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief summary of your complaint/feedback"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select
              onValueChange={handleSelectChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide details about your complaint or feedback"
              rows={5}
              required
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="attachments">Supporting Documents or Images (Optional)</Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="attachments"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-1 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF (MAX. 10MB)
                  </p>
                </div>
                <Input
                  id="attachments"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                />
              </label>
            </div>
            {files && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">
                  {Array.from(files).length} file(s) selected
                </p>
                <ul className="mt-1 text-xs text-gray-500">
                  {Array.from(files).map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="anonymous" 
              checked={formData.isAnonymous}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="anonymous">Submit anonymously</Label>
            <p className="text-xs text-gray-500 ml-2">
              (Your identity will not be revealed to faculty/staff)
            </p>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              className="ml-2" 
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ComplaintForm;
