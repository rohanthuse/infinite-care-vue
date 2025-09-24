import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Share2, Gift, Users, Send, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CarerReferFriendTabProps {
  carerId: string;
}

export const CarerReferFriendTab: React.FC<CarerReferFriendTabProps> = ({ carerId }) => {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("CARE-JOHN-2024");
  const [copied, setCopied] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  
  const [formData, setFormData] = useState({
    friendName: '',
    friendEmail: '',
    friendPhone: '',
    message: 'Hi! I work for this amazing care company and thought you might be interested in joining our team. They offer great training, flexible hours, and a supportive work environment. Would you like to know more?'
  });

  const referralHistory = [
    {
      id: 1,
      name: 'Sarah Williams',
      email: 'sarah.w@email.com',
      dateSent: '2024-01-10',
      status: 'hired',
      reward: '£250'
    },
    {
      id: 2,
      name: 'Mike Johnson',
      email: 'mike.j@email.com',
      dateSent: '2024-01-05',
      status: 'interviewed',
      reward: 'Pending'
    },
    {
      id: 3,
      name: 'Emma Davis',
      email: 'emma.d@email.com',
      dateSent: '2023-12-20',
      status: 'applied',
      reward: 'Pending'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hired':
        return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      case 'interviewed':
        return <Badge className="bg-blue-100 text-blue-800">Interviewed</Badge>;
      case 'applied':
        return <Badge className="bg-amber-100 text-amber-800">Applied</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({
      title: "Referral code copied!",
      description: "Share this code with your friends."
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReferral = () => {
    // TODO: Implement actual referral sending logic
    toast({
      title: "Referral sent successfully!",
      description: `Invitation sent to ${formData.friendName}`
    });
    setFormData({
      friendName: '',
      friendEmail: '',
      friendPhone: '',
      message: formData.message
    });
    setShowReferralForm(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Refer a Friend Program
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Gift className="h-6 w-6 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Earn Rewards for Referrals!</h3>
            </div>
            <p className="text-sm text-purple-800 mb-3">
              Refer qualified friends to join our care team and earn up to £250 for each successful hire.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="text-center p-2 bg-white/50 rounded">
                <div className="font-semibold text-purple-600">£50</div>
                <div>Application</div>
              </div>
              <div className="text-center p-2 bg-white/50 rounded">
                <div className="font-semibold text-purple-600">£100</div>
                <div>Interview</div>
              </div>
              <div className="text-center p-2 bg-white/50 rounded">
                <div className="font-semibold text-purple-600">£250</div>
                <div>Hired & 3 Months</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <Label className="text-sm font-medium">Your Referral Code</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="px-3 py-2 bg-white border rounded font-mono text-sm">
                  {referralCode}
                </code>
                <Button size="sm" variant="outline" onClick={copyReferralCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={() => setShowReferralForm(true)}>
              <Send className="h-4 w-4 mr-2" />
              Send Referral
            </Button>
          </div>
        </CardContent>
      </Card>

      {showReferralForm && (
        <Card>
          <CardHeader>
            <CardTitle>Send Referral Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="friend-name">Friend's Name</Label>
                <Input
                  id="friend-name"
                  value={formData.friendName}
                  onChange={(e) => setFormData({...formData, friendName: e.target.value})}
                  placeholder="Enter friend's full name"
                />
              </div>
              
              <div>
                <Label htmlFor="friend-email">Friend's Email</Label>
                <Input
                  id="friend-email"
                  type="email"
                  value={formData.friendEmail}
                  onChange={(e) => setFormData({...formData, friendEmail: e.target.value})}
                  placeholder="friend@example.com"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="friend-phone">Friend's Phone (Optional)</Label>
              <Input
                id="friend-phone"
                value={formData.friendPhone}
                onChange={(e) => setFormData({...formData, friendPhone: e.target.value})}
                placeholder="+44 7xxx xxx xxx"
              />
            </div>
            
            <div>
              <Label htmlFor="message">Personal Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={4}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSendReferral}>
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
              <Button variant="outline" onClick={() => setShowReferralForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referralHistory.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{referral.name}</h4>
                    <p className="text-sm text-muted-foreground">{referral.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Referred: {new Date(referral.dateSent).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  {getStatusBadge(referral.status)}
                  <p className="text-sm font-medium text-green-600 mt-1">
                    {referral.reward}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-muted-foreground">Total Referrals</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">1</div>
              <div className="text-sm text-muted-foreground">Successful Hires</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">£250</div>
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">£150</div>
              <div className="text-sm text-muted-foreground">Pending Rewards</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};