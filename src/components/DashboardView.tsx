import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Activity, 
  Layers, 
  Shield, 
  Bot, 
  Cpu, 
  FlaskConical, 
  Zap, 
  ChevronRight,
  Database,
  BarChart3,
  UserPlus,
  CheckCircle,
  XCircle,
  Users,
  Wallet,
  Trash2,
  X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface DashboardViewProps {
  onNavigate: (view: string, id?: string) => void;
}

const calculateCredits = (model: string, inputTokens: number, outputTokens: number) => {
  const isLarge = model.toLowerCase().includes('large');
  const inputCost = isLarge ? 5 : 1;
  const outputCost = isLarge ? 10 : 2;
  return (inputTokens * inputCost + outputTokens * outputCost) / 1000000;
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { profile, user, isConfigured } = useAuth();
  
  // Usage State
  const [modelStats, setModelStats] = useState<Record<string, { input: number, output: number, credits: number }>>({});
  const [totalLifetimeCredits, setTotalLifetimeCredits] = useState(0);
  const [totalMonthlyCredits, setTotalMonthlyCredits] = useState(0);
  const [usageHistoryData, setUsageHistoryData] = useState<any[]>([]);

  // Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(10);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);

  // Modals
  const [activeModal, setActiveModal] = useState<'none' | 'usage' | 'wallet'>('none');

  // Misc State
  const [myEnterpriseName, setMyEnterpriseName] = useState<string | null>(null);

  // Invitation State
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteCreditLimit, setInviteCreditLimit] = useState<number>(10);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  // Enterprise Member State
  const [enterpriseMembers, setEnterpriseMembers] = useState<any[]>([]);
  const [membersUsage, setMembersUsage] = useState<Record<string, { input: number, output: number, lifetime_credits: number, monthly_credits: number, username: string }>>({});

  // API Key State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!isConfigured || !profile || !user) return;
    if (profile.accountType === 'enterprise') {
      const { data } = await supabase.from('enterprise_invitations').select('*').eq('enterprise_id', user.id).order('created_at', { ascending: false });
      if (data) setInvitations(data);
    } else if (profile.username) {
      const { data } = await supabase.from('enterprise_invitations').select('*').eq('username', profile.username).order('created_at', { ascending: false });
      if (data) setInvitations(data);
    }
  };

  const fetchApiKeys = async () => {
    if (!user) return;
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setApiKeys(data);
  };

  const fetchWalletHistory = async () => {
    if (!user) return;
    const { data } = await supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setWalletTransactions(data);
  };

  useEffect(() => {
    if (isConfigured && user && profile) {
      fetchInvitations();
      fetchApiKeys();
      fetchWalletHistory();

      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);

      // Fetch personal wallet balance
      const fetchWallet = async () => {
        const { data } = await supabase.from('profiles').select('credit_balance').eq('id', user.id).single();
        if (data) setWalletBalance(data.credit_balance);
      };
      fetchWallet();

      if (profile.accountType !== 'enterprise') {
        const fetchStandardData = async () => {
          if (profile.enterpriseId) {
            const { data } = await supabase.from('profiles').select('enterprise_name').eq('id', profile.enterpriseId).single();
            if (data?.enterprise_name) setMyEnterpriseName(data.enterprise_name);
          }

          let query = supabase
            .from('token_usage')
            .select('model_name, input_tokens, output_tokens, created_at')
            .eq('user_id', user.id);

          if (profile.enterpriseId) {
            query = query.eq('enterprise_id', profile.enterpriseId);
          } else {
            query = query.is('enterprise_id', null);
          }

          const { data, error } = await query;

          if (!error && data) {
            const stats: Record<string, { input: number, output: number, credits: number }> = {};
            let tLifetime = 0;
            let tMonthly = 0;
            const historyMap: Record<string, number> = {};

            data.forEach(row => {
              const m = row.model_name;
              const dateObj = new Date(row.created_at);
              const dateStr = dateObj.toLocaleDateString();

              const credits = calculateCredits(m, row.input_tokens, row.output_tokens);
              
              if (!stats[m]) stats[m] = { input: 0, output: 0, credits: 0 };
              stats[m].input += row.input_tokens;
              stats[m].output += row.output_tokens;
              stats[m].credits += credits;
              
              tLifetime += credits;
              if (dateObj >= currentMonthStart) {
                tMonthly += credits;
              }

              if (!historyMap[dateStr]) historyMap[dateStr] = 0;
              historyMap[dateStr] += credits;
            });

            const historyArr = Object.entries(historyMap)
              .map(([date, credits]) => ({ date, credits }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(-30);

            setUsageHistoryData(historyArr);
            setModelStats(stats);
            setTotalLifetimeCredits(tLifetime);
            setTotalMonthlyCredits(tMonthly);
          }
        };
        fetchStandardData();
      } else {
        // Fetch Enterprise Data
        const fetchEnterpriseData = async () => {
          const { data: members } = await supabase
            .from('profiles')
            .select('*')
            .eq('enterprise_id', user.id);
          
          if (members) {
            // Ensure owner is at the top
            let sortedMembers = [...members];
            const ownerIndex = sortedMembers.findIndex(m => m.id === user.id);
            if (ownerIndex !== -1) {
              const owner = sortedMembers.splice(ownerIndex, 1)[0];
              owner.username = owner.username ? `${owner.username} (Owner)` : 'Owner';
              sortedMembers.unshift(owner);
            }
            setEnterpriseMembers(sortedMembers);
          }

          const { data: usageData, error: usageError } = await supabase
            .from('token_usage')
            .select('user_id, model_name, input_tokens, output_tokens, created_at')
            .eq('enterprise_id', user.id);
            
          if (usageError) console.error("Error fetching usage:", usageError);
            
          if (usageData) {
            const usageMap: Record<string, { input: number, output: number, lifetime_credits: number, monthly_credits: number, username: string }> = {};
            const historyMap: Record<string, number> = {};
            let tLifetime = 0;
            let tMonthly = 0;

            usageData.forEach(row => {
              const dateObj = new Date(row.created_at);
              const dateStr = dateObj.toLocaleDateString();
              const credits = calculateCredits(row.model_name, row.input_tokens, row.output_tokens);

              if (!usageMap[row.user_id]) {
                const foundMember = members?.find(m => m.id === row.user_id);
                const isOwner = row.user_id === user.id;
                usageMap[row.user_id] = { 
                  input: 0, 
                  output: 0, 
                  lifetime_credits: 0, 
                  monthly_credits: 0,
                  username: foundMember ? (isOwner ? `${foundMember.username} (Owner)` : foundMember.username) : 'Removed User' 
                };
              }
              
              usageMap[row.user_id].input += row.input_tokens;
              usageMap[row.user_id].output += row.output_tokens;
              usageMap[row.user_id].lifetime_credits += credits;
              tLifetime += credits;

              if (dateObj >= currentMonthStart) {
                usageMap[row.user_id].monthly_credits += credits;
                tMonthly += credits;
              }

              if (!historyMap[dateStr]) historyMap[dateStr] = 0;
              historyMap[dateStr] += credits;
            });

            const historyArr = Object.entries(historyMap)
              .map(([date, credits]) => ({ date, credits }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(-30);

            setUsageHistoryData(historyArr);
            setMembersUsage(usageMap);
            setTotalLifetimeCredits(tLifetime);
            setTotalMonthlyCredits(tMonthly);
          }
        };
        fetchEnterpriseData();
      }
    }
  }, [user, profile, isConfigured]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setInviteLoading(true);
    setInviteMsg('');
    const { error } = await supabase.from('enterprise_invitations').insert({
      enterprise_id: user?.id,
      username: inviteUsername,
      credit_limit: inviteCreditLimit
    });
    setInviteLoading(false);
    if (error) {
      if (error.code === '23503') {
        setInviteMsg(`User '${inviteUsername}' does not exist.`);
      } else {
        setInviteMsg(error.message);
      }
    } else {
      setInviteMsg('Invitation sent successfully!');
      setInviteUsername('');
      fetchInvitations();
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    await supabase.from('enterprise_invitations').delete().eq('id', invitationId);
    fetchInvitations();
  };

  const handleAcceptInvite = async (invitationId: string) => {
    const { error } = await supabase.rpc('accept_invitation', { invitation_id: invitationId });
    if (!error) window.location.reload();
  };

  const handleRejectInvite = async (invitationId: string) => {
    await supabase.rpc('reject_invitation', { invitation_id: invitationId });
    fetchInvitations();
  };

  const handleUpdateLimit = async (memberId: string, currentLimit: number) => {
    const newLimit = prompt('Enter new monthly credit limit (€):', currentLimit.toString());
    if (newLimit && !isNaN(Number(newLimit))) {
      await supabase.from('profiles').update({ credit_limit: Number(newLimit) }).eq('id', memberId);
      window.location.reload();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member? Their credit limit will be reset.')) {
      const { error } = await supabase.rpc('remove_enterprise_member', { member_id: memberId });
      if (!error) {
        window.location.reload();
      } else {
        alert('Failed to remove member: ' + error.message);
      }
    }
  };

  const handleTopUp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const amount = prompt('MOCK PAYMENT: How many € would you like to add to your wallet?', '100');
    if (amount && !isNaN(Number(amount))) {
      const { error } = await supabase.rpc('top_up_wallet', { amount: Number(amount) });
      if (!error) {
        alert(`Successfully topped up €${amount}!`);
        window.location.reload();
      } else {
        alert('Top up failed: ' + error.message);
      }
    }
  };

  const handleCreateApiKey = async () => {
    const newKeyString = 'sk-proj-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const { error } = await supabase.from('api_keys').insert({
      user_id: user?.id,
      key_value: newKeyString
    });
    if (!error) {
      setNewKey(newKeyString);
      fetchApiKeys();
    } else {
      alert('Failed to create API key');
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? Any applications using it will immediately lose access.')) {
      await supabase.from('api_keys').delete().eq('id', id);
      fetchApiKeys();
    }
  };

  // --------------------------------------------------------
  // MODALS
  // --------------------------------------------------------
  const renderModals = () => {
    if (activeModal === 'none') return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#121212] border border-[#333333] rounded-2xl p-6 w-full max-w-3xl shadow-2xl relative overflow-hidden">
          <button onClick={() => setActiveModal('none')} className="absolute top-4 right-4 text-[#666666] hover:text-[#F5F5F5] transition-colors">
            <X className="w-6 h-6" />
          </button>

          {activeModal === 'usage' && (
            <div>
              <h2 className="text-xl font-bold text-[#F5F5F5] uppercase tracking-wider mb-2 border-b border-[#333333] pb-4 flex items-center gap-2">
                <BarChart3 className="text-[#FFD54F]" /> Usage Analytics (Last 30 Days)
              </h2>
              <div className="h-72 w-full mt-6 mb-6">
                {usageHistoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageHistoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                      <XAxis dataKey="date" stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#666666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333333', borderRadius: '8px', color: '#F5F5F5' }}
                        itemStyle={{ color: '#FFD54F', fontWeight: 'bold' }}
                        formatter={(value: any) => [`€${Number(value).toFixed(4)}`, 'Credits Used']}
                      />
                      <Line type="monotone" dataKey="credits" stroke="#FFD54F" strokeWidth={3} dot={{ fill: '#121212', stroke: '#FFD54F', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#666666] italic text-sm">No usage data for the last 30 days.</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#333333]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Lifetime Credits Used</p>
                  <p className="text-2xl font-mono text-[#F5F5F5]">€{totalLifetimeCredits.toFixed(4)}</p>
                </div>
                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#333333]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Current Month (Resets on 1st)</p>
                  <p className="text-2xl font-mono text-[#FFD54F]">€{totalMonthlyCredits.toFixed(4)}</p>
                </div>
              </div>
            </div>
          )}

          {activeModal === 'wallet' && (
            <div>
              <h2 className="text-xl font-bold text-[#F5F5F5] uppercase tracking-wider mb-2 border-b border-[#333333] pb-4 flex items-center gap-2">
                <Wallet className="text-emerald-400" /> Wallet & Top-Up Ledger
              </h2>
              <div className="flex justify-between items-center bg-emerald-950/20 border border-emerald-900/50 p-6 rounded-xl mt-6 mb-6">
                <div>
                  <p className="text-emerald-200/70 text-xs font-bold uppercase tracking-wider mb-1">Current Balance</p>
                  <p className="text-3xl font-mono text-emerald-400">€{walletBalance.toFixed(2)}</p>
                </div>
                <button onClick={handleTopUp} className="bg-emerald-500 text-black px-6 py-2 rounded-lg font-bold uppercase text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors">
                  Add Funds
                </button>
              </div>
              
              <h3 className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-3">Recent Transactions</h3>
              <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                {walletTransactions.map(tx => (
                  <div key={tx.id} className="bg-[#1A1A1A] border border-[#333333] p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-[#F5F5F5] text-sm font-bold">Wallet Top-Up</p>
                      <p className="text-[#666666] text-[10px]">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold">+ €{Number(tx.amount).toFixed(2)}</span>
                  </div>
                ))}
                {walletTransactions.length === 0 && (
                  <p className="text-[#666666] italic text-sm text-center py-4">No top-up transactions found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --------------------------------------------------------
  // DASHBOARDS
  // --------------------------------------------------------
  const renderEnterpriseDashboard = () => {
    const chartData = Object.entries(membersUsage).map(([userId, usage]) => {
      return {
        name: usage.username,
        "Lifetime Credits": Number((usage.lifetime_credits || 0).toFixed(4)),
        "Monthly Credits": Number((usage.monthly_credits || 0).toFixed(4)),
      };
    });

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg flex items-center justify-between cursor-default transition-all">
            <div>
              <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Total Members</p>
              <p className="text-3xl font-mono text-[#F5F5F5]">{enterpriseMembers.length}</p>
            </div>
            <Users className="w-8 h-8 text-[#333333]" />
          </div>
          
          <div 
            onClick={() => setActiveModal('wallet')}
            className="bg-[#1A1A1A] border border-[#333333] hover:border-emerald-500/50 rounded-xl p-6 shadow-lg flex items-center justify-between cursor-pointer group transition-all"
          >
            <div>
              <p className="text-[#666666] group-hover:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 transition-colors">Available Wallet Balance</p>
              <p className="text-3xl font-mono text-emerald-400">€{walletBalance.toFixed(2)}</p>
              <span className="text-[10px] mt-2 font-bold uppercase text-[#FFD54F] group-hover:underline">View Ledger & Top Up</span>
            </div>
            <Wallet className="w-8 h-8 text-emerald-400/20 group-hover:text-emerald-400/50 transition-colors" />
          </div>
          
          <div 
            onClick={() => setActiveModal('usage')}
            className="bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/50 rounded-xl p-6 shadow-lg flex items-center justify-between cursor-pointer group transition-all"
          >
            <div>
              <p className="text-[#666666] group-hover:text-[#FFD54F] text-xs font-bold uppercase tracking-wider mb-1 transition-colors">Total Credits (This Month)</p>
              <p className="text-3xl font-mono text-[#FFD54F]">€{totalMonthlyCredits.toFixed(4)}</p>
              <span className="text-[10px] mt-2 font-bold uppercase text-[#666666] group-hover:text-[#F5F5F5]">View Deep Stats</span>
            </div>
            <BarChart3 className="w-8 h-8 text-[#FFD54F]/20 group-hover:text-[#FFD54F]/50 transition-colors" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2">
          Credit Usage by Member
        </h2>
        {chartData.length > 0 ? (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg mb-10 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                <Tooltip 
                  cursor={{ fill: '#252525' }}
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid #333333', borderRadius: '8px', color: '#F5F5F5' }}
                  itemStyle={{ color: '#FFD54F', fontWeight: 'bold' }}
                />
                <Bar dataKey="Monthly Credits" fill="#FFD54F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lifetime Credits" fill="#333333" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-10 shadow-lg mb-10 text-center">
            <p className="text-[#666666] text-sm">No token usage recorded yet.</p>
          </div>
        )}

        <h2 className="text-lg font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2 mt-8">
          Member Management
        </h2>
        <div className="bg-[#121212] border border-[#333333] rounded-xl overflow-hidden mb-10 shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] border-b border-[#333333]">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666]">Username</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666]">Input Tokens</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666]">Output Tokens</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666]">Monthly Credits vs Limit</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enterpriseMembers.map(member => {
                const usage = membersUsage[member.id] || { input: 0, output: 0, monthly_credits: 0, lifetime_credits: 0 };
                const limit = member.credit_limit || 10;
                const pct = Math.min((usage.monthly_credits / limit) * 100, 100);
                const isOwner = member.id === user?.id;

                return (
                  <tr key={member.id} className="border-b border-[#333333]/50 hover:bg-[#1A1A1A]/50 transition-colors">
                    <td className="p-4 text-sm font-semibold text-[#F5F5F5]">{member.username}</td>
                    <td className="p-4 text-xs text-[#BDBDBD] font-mono">{usage.input.toLocaleString()}</td>
                    <td className="p-4 text-xs text-[#BDBDBD] font-mono">{usage.output.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex justify-between text-[10px] mb-1.5 uppercase font-bold tracking-wide">
                        <span className="text-[#BDBDBD]">€{usage.monthly_credits.toFixed(4)} USED</span>
                        <span className="text-[#666666]">€{limit.toFixed(2)} LIMIT</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#252525] rounded-full overflow-hidden">
                        <div className={`h-full ${pct > 90 ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </td>
                    <td className="p-4 flex gap-2 justify-end">
                      <button onClick={() => handleUpdateLimit(member.id, limit)} className="px-3 py-1.5 bg-[#252525] hover:bg-[#333333] text-[#FFD54F] border border-[#FFD54F]/30 rounded text-xs font-bold uppercase transition-colors">Edit Limit</button>
                      {!isOwner && (
                        <button onClick={() => handleRemoveMember(member.id)} className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase transition-colors">Remove</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {enterpriseMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#666666] italic text-sm">No active members in this enterprise.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="text-lg font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2 mt-8">
          Pending & Sent Invitations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#121212] border border-[#333333] rounded-xl p-5 shadow-lg">
            <h3 className="text-[#F5F5F5] font-bold text-sm mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#FFD54F]" /> Invite New Member</h3>
            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#666666] mb-1">Username to Invite</label>
                <input type="text" required value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#FFD54F] outline-none transition-colors" placeholder="e.g. alice_dev" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#666666] mb-1">Monthly Credit Limit (€)</label>
                <input type="number" required value={inviteCreditLimit} onChange={(e) => setInviteCreditLimit(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#FFD54F] outline-none transition-colors" min="1" step="1" />
              </div>
              <button type="submit" disabled={inviteLoading} className="w-full bg-[#FFD54F] text-black font-bold text-xs uppercase tracking-wider py-2 rounded-lg hover:bg-[#FFCA28] transition-colors disabled:opacity-50">
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </button>
              {inviteMsg && <p className={`text-xs mt-2 ${inviteMsg.includes('does not exist') || inviteMsg.includes('error') ? 'text-red-400' : 'text-emerald-400'}`}>{inviteMsg}</p>}
            </form>
          </div>
          <div className="bg-[#121212] border border-[#333333] rounded-xl p-5 overflow-y-auto max-h-[300px] shadow-lg">
            <h3 className="text-[#F5F5F5] font-bold text-sm mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-[#FFD54F]" /> Sent Invitations</h3>
            {invitations.length === 0 ? (
              <p className="text-xs text-[#666666] italic">No invitations sent yet.</p>
            ) : (
              <div className="space-y-2">
                {invitations.map(inv => (
                  <div key={inv.id} className="p-3 bg-[#1A1A1A] border border-[#333333] rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-[#F5F5F5]">{inv.username}</p>
                      <p className="text-[10px] text-[#666666]">Limit: €{inv.credit_limit?.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${inv.status === 'accepted' ? 'bg-emerald-400/10 text-emerald-400' : inv.status === 'rejected' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                        {inv.status}
                      </span>
                      {inv.status === 'pending' && (
                        <button onClick={() => handleRevokeInvite(inv.id)} className="text-[#666666] hover:text-red-400 transition-colors" title="Revoke Invite"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderInvitationsList = () => {
    const pending = invitations.filter(i => i.status === 'pending');
    if (pending.length === 0) return null;
    return (
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg mb-8">
        <h3 className="text-[#F5F5F5] font-bold text-sm mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#FFD54F]" /> Pending Enterprise Invitations</h3>
        <div className="space-y-3">
          {pending.map(inv => (
            <div key={inv.id} className="p-4 bg-[#121212] border border-[#333333] rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-[#F5F5F5]">An Enterprise is inviting you to join</p>
                <p className="text-xs text-[#BDBDBD] mt-1">They will sponsor you with a limit of <strong className="text-[#FFD54F]">€{inv.credit_limit?.toFixed(2)}</strong> per month.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAcceptInvite(inv.id)} className="p-2 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 rounded-lg transition-colors" title="Accept"><CheckCircle className="w-5 h-5" /></button>
                <button onClick={() => handleRejectInvite(inv.id)} className="p-2 bg-red-400/10 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors" title="Reject"><XCircle className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnterpriseLink = () => {
    if (!profile?.enterpriseId) return null;
    return (
      <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-6 shadow-lg mb-8 flex items-center gap-4">
        <div className="p-3 bg-emerald-900/40 rounded-lg"><Shield className="w-6 h-6 text-emerald-400" /></div>
        <div>
          <h3 className="text-emerald-400 font-bold text-sm">Sponsored by Enterprise</h3>
          <p className="text-xs text-emerald-200/70 mt-1">
            {myEnterpriseName ? `You are a member of ${myEnterpriseName}. ` : 'Your token usage is currently being sponsored. '}
            Monthly Limit: <strong className="text-white">€{profile.creditLimit?.toFixed(2)} Credits</strong>.
          </p>
        </div>
      </div>
    );
  };

  const renderResearcherDashboard = () => (
    <>
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2">
          Usage & Limits
        </h2>
        {renderInvitationsList()}
        {renderEnterpriseLink()}
        
        {!profile?.enterpriseId && (
          <div 
            onClick={() => setActiveModal('wallet')}
            className="bg-[#1A1A1A] border border-[#333333] hover:border-emerald-500/50 rounded-xl p-6 shadow-lg flex items-center justify-between mb-8 cursor-pointer group transition-all"
          >
            <div>
              <p className="text-[#666666] group-hover:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 transition-colors">Available Wallet Balance</p>
              <p className="text-3xl font-mono text-emerald-400">€{walletBalance.toFixed(2)}</p>
              <span className="text-[10px] mt-2 font-bold uppercase text-[#FFD54F] group-hover:underline">View Ledger & Top Up</span>
            </div>
            <Wallet className="w-8 h-8 text-emerald-400/20 group-hover:text-emerald-400/50 transition-colors" />
          </div>
        )}

        <div onClick={() => setActiveModal('usage')} className="bg-[#1A1A1A] hover:bg-[#202020] border border-[#333333] hover:border-[#FFD54F]/50 rounded-xl p-6 max-w-2xl shadow-lg text-left cursor-pointer group transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold uppercase text-[#FFD54F] tracking-wider group-hover:underline">Click to view deep analytics</span>
            <ChevronRight className="w-4 h-4 text-[#666666] group-hover:text-[#FFD54F]" />
          </div>
          {renderUsageMetrics()}
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2">
        Developer Tools
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#F5F5F5] font-bold text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-[#FFD54F]" /> Developer API Keys
            </h3>
            <button onClick={handleCreateApiKey} className="text-xs px-3 py-1.5 bg-[#FFD54F] text-black font-bold uppercase tracking-wider rounded hover:bg-[#FFCA28]">Create Key</button>
          </div>
          
          {newKey && (
            <div className="bg-emerald-950/40 border border-emerald-900/50 p-4 rounded-lg mb-4">
              <p className="text-emerald-400 text-xs font-bold mb-2">Please copy this key now. You will not be able to see it again!</p>
              <code className="text-sm text-white font-mono break-all">{newKey}</code>
            </div>
          )}

          <div className="space-y-3">
            {apiKeys.map(k => (
              <div key={k.id} className="p-3 bg-[#121212] rounded border border-[#333333] flex justify-between items-center">
                <div>
                  <p className="text-[#F5F5F5] text-sm font-mono">{k.key_value.substring(0, 12)}...{k.key_value.substring(k.key_value.length - 4)}</p>
                  <p className="text-[#666666] text-[10px]">Created: {new Date(k.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded font-bold uppercase">Active</span>
                  <button onClick={() => handleRevokeApiKey(k.id)} className="text-[#666666] hover:text-red-400 transition-colors" title="Revoke Key"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {apiKeys.length === 0 && <p className="text-xs text-[#666666] italic">No active API keys.</p>}
          </div>
        </div>
        
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg">
          <h3 className="text-[#F5F5F5] font-bold text-lg flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-[#FFD54F]" /> Sandbox Environments
          </h3>
          <p className="text-sm text-[#BDBDBD] mb-6">
            Access secure, isolated instances of the 120B omni model to test prompts and logic before production deployment.
          </p>
          <button 
            onClick={() => onNavigate('api-docs')}
            className="w-full py-3 bg-[#121212] border border-[#FFD54F]/30 hover:border-[#FFD54F] rounded-lg text-[#FFD54F] font-bold uppercase tracking-wider text-xs transition-colors"
          >
            Launch API Playground
          </button>
        </div>
      </div>
    </>
  );

  const renderUsageMetrics = () => {
    const isEnterpriseSponsored = !!profile?.enterpriseId;
    const limit = profile?.creditLimit || 0;
    const pct = isEnterpriseSponsored ? Math.min((totalMonthlyCredits / limit) * 100, 100) : 0;

    return (
      <>
        {isEnterpriseSponsored ? (
          <>
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">Enterprise Allocation Used (This Month)</span>
              <span className="text-lg font-mono text-[#F5F5F5]">€{totalMonthlyCredits.toFixed(4)} <span className="text-sm text-[#666666]">/ €{limit.toFixed(2)}</span></span>
            </div>
            <div className="w-full h-2 bg-[#252525] rounded-full overflow-hidden mb-4">
              <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
            </div>
            <p className="text-xs text-emerald-400 mt-2 mb-4 font-semibold">€{(limit - totalMonthlyCredits).toFixed(4)} allocated credits remaining</p>
          </>
        ) : (
          <div className="flex justify-between items-end mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">Total Monthly Usage</span>
            <span className="text-lg font-mono text-[#F5F5F5]">€{totalMonthlyCredits.toFixed(4)}</span>
          </div>
        )}
        
        <div className="space-y-4 mb-4 border-t border-[#252525] pt-4">
          <p className="text-[10px] font-bold text-[#BDBDBD] uppercase tracking-wider mb-2">Usage by Model</p>
          {Object.entries(modelStats).length > 0 ? (
            Object.entries(modelStats).map(([model, stats]) => (
              <div key={model} className="bg-[#121212] border border-[#333333] p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#F5F5F5] font-semibold text-sm">{model}</span>
                  <span className="text-[#FFD54F] font-mono font-bold">€{stats.credits.toFixed(4)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#666666] block uppercase tracking-wider text-[10px]">Input Tokens</span>
                    <span className="text-[#BDBDBD] font-mono">{stats.input.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#666666] block uppercase tracking-wider text-[10px]">Output Tokens</span>
                    <span className="text-[#BDBDBD] font-mono">{stats.output.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#666666] italic">No tokens used yet.</p>
          )}
        </div>
      </>
    );
  };

  const renderStandardDashboard = () => (
    <div className="max-w-3xl mx-auto">
      {renderInvitationsList()}
      {renderEnterpriseLink()}
      
      {!profile?.enterpriseId && (
        <div 
          onClick={() => setActiveModal('wallet')}
          className="bg-[#1A1A1A] border border-[#333333] hover:border-emerald-500/50 rounded-xl p-6 shadow-lg flex items-center justify-between mb-8 cursor-pointer group transition-all"
        >
          <div>
            <p className="text-[#666666] group-hover:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 transition-colors">Available Wallet Balance</p>
            <p className="text-3xl font-mono text-emerald-400">€{walletBalance.toFixed(2)}</p>
            <span className="text-[10px] mt-2 font-bold uppercase text-[#FFD54F] group-hover:underline">View Ledger & Top Up</span>
          </div>
          <Wallet className="w-8 h-8 text-emerald-400/20 group-hover:text-emerald-400/50 transition-colors" />
        </div>
      )}

      <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8 text-center shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">
          {profile?.enterpriseId ? 'Enterprise Plan' : 'Standard Tier'}
        </h2>
        <p className="text-[#BDBDBD] text-sm mb-8 max-w-lg mx-auto">
          {profile?.enterpriseId ? 'Your API requests and chat sessions are sponsored by your organization.' : 'You are currently on the standard tier. Top up your wallet to continue using Anacleto AI.'}
        </p>

        <div onClick={() => setActiveModal('usage')} className="bg-[#121212] hover:bg-[#202020] border border-[#333333] hover:border-[#FFD54F]/50 rounded-xl p-6 max-w-md mx-auto mb-8 text-left shadow-lg cursor-pointer group transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold uppercase text-[#FFD54F] tracking-wider group-hover:underline">Click to view deep analytics</span>
            <ChevronRight className="w-4 h-4 text-[#666666] group-hover:text-[#FFD54F]" />
          </div>
          {renderUsageMetrics()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigate('chat')}
          className="bg-[#121212] border border-[#333333] hover:border-[#FFD54F]/50 rounded-xl p-6 cursor-pointer transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-[#FFD54F]" />
          </div>
          <h3 className="text-[#F5F5F5] font-bold mb-2">Open Anacleto Chat</h3>
          <p className="text-[#666666] text-xs">Jump back into your secure conversational interface.</p>
        </div>
        <div className="bg-[#121212] border border-[#333333] rounded-xl p-6 opacity-50">
          <div className="w-12 h-12 rounded-xl bg-[#333333] flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-[#666666]" />
          </div>
          <h3 className="text-[#F5F5F5] font-bold mb-2">Developer API (Pro)</h3>
          <p className="text-[#666666] text-xs">Upgrade to access raw API keys and playground.</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {renderModals()}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative transition-all ${activeModal !== 'none' ? 'blur-sm grayscale-[0.5] opacity-50' : ''}`}>
        <div className="mb-8 border-b border-[#333333] pb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#F5F5F5] uppercase tracking-tight">
              {profile?.accountType === 'enterprise' && 'Enterprise Portal'}
              {profile?.accountType === 'developer' && 'Developer Portal'}
              {profile?.accountType === 'standard' && 'User Dashboard'}
            </h1>
            <p className="text-[#BDBDBD] text-sm mt-1">Welcome back, {profile?.username || profile?.enterpriseName || profile?.email}</p>
          </div>
          <div className="px-3 py-1 rounded bg-[#121212] border border-[#333333] text-xs font-bold uppercase tracking-wider text-[#FFD54F]">
            Account: {profile?.accountType}
          </div>
        </div>

        {profile?.accountType === 'enterprise' && renderEnterpriseDashboard()}
        {profile?.accountType === 'developer' && renderResearcherDashboard()}
        {profile?.accountType === 'standard' && renderStandardDashboard()}
      </div>
    </>
  );
};
