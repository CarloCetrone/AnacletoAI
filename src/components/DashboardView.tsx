import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, 
  Activity, 
  Layers, 
  Shield, 
  Bot, 
  Cpu, 
  Zap, 
  BarChart3,
  Users,
  Wallet,
  Trash2,
  X,
  Code2,
  Sparkles,
  Download,
  ArrowUpRight,
  Power,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Server,
  Terminal,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Building2,
  UserPlus,
  UserCheck,
  Check,
  Ban,
  Star
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth, ApiKeyItem } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface DashboardViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { profile, user, isConfigured, fetchApiKeys, createApiKey, toggleApiKeyStatus, deleteApiKey } = useAuth();
  
  // Analytics Filter States
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'ytd'>('7d');
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<'all' | 'api_calls' | 'platform_chat'>('all');
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState<boolean>(true);

  // Supabase Data States
  const [dbUsageRecords, setDbUsageRecords] = useState<any[]>([]);
  const [loadingUsage, setLoadingUsage] = useState<boolean>(true);
  
  // Wallet & Credit State
  const [walletBalance, setWalletBalance] = useState<number>(10);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(50);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState<boolean>(false);

  // Enterprise Sponsorship & Invitations State
  const [sponsoringEnterpriseName, setSponsoringEnterpriseName] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [sponsoredMembers, setSponsoredMembers] = useState<any[]>([]);
  const [inviteUsername, setInviteUsername] = useState<string>('');
  const [inviteCreditLimit, setInviteCreditLimit] = useState<number>(100);
  const [isSponsoringUser, setIsSponsoringUser] = useState<boolean>(false);
  const [sponsorError, setSponsorError] = useState<string>('');

  // API Key State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);

  // Fetch Usage, Credit & Invitations Data directly from Supabase DB
  const fetchSupabaseData = async () => {
    if (!user || !isConfigured) return;
    setLoadingUsage(true);

    try {
      // 1. Fetch Real User Profile Balance & Sponsorship from Supabase DB
      const { data: profileData } = await supabase
        .from('profiles')
        .select('credit_balance, credit_limit, enterprise_id, username, account_type, enterprise_name')
        .eq('id', user.id)
        .maybeSingle();

      const isEnterpriseAccount = profileData?.account_type === 'enterprise' || profile?.accountType === 'enterprise';

      if (profileData) {
        if (profileData.credit_balance !== null && profileData.credit_balance !== undefined) {
          setWalletBalance(Number(profileData.credit_balance));
        }
        if (profileData.credit_limit) {
          setCreditLimit(Number(profileData.credit_limit));
        } else {
          setCreditLimit(0);
        }

        // If user is sponsored by an enterprise, fetch enterprise details
        if (profileData.enterprise_id) {
          const { data: entProfile } = await supabase
            .from('profiles')
            .select('enterprise_name, username')
            .eq('id', profileData.enterprise_id)
            .maybeSingle();
          if (entProfile) {
            setSponsoringEnterpriseName(entProfile.enterprise_name || entProfile.username || 'Enterprise Partner');
          }
        } else {
          setSponsoringEnterpriseName(null);
        }
      }

      // 2. Fetch Pending Enterprise Invitations for current user
      const userIdentifier = profileData?.username || profile?.username;
      if (userIdentifier && !profileData?.enterprise_id) {
        const { data: invData } = await supabase
          .from('enterprise_invitations')
          .select('*')
          .eq('username', userIdentifier)
          .eq('status', 'pending');

        if (invData && invData.length > 0) {
          setPendingInvitations(invData);
        } else {
          setPendingInvitations([]);
        }
      } else {
        setPendingInvitations([]);
      }

      // 3. If current user is an Enterprise Admin, fetch sponsored members
      if (isEnterpriseAccount) {
        const { data: teamData } = await supabase
          .from('profiles')
          .select('id, username, account_type, credit_balance, credit_limit')
          .eq('enterprise_id', user.id);
        
        if (teamData) {
          setSponsoredMembers(teamData);
        }
      }

      // 4. Fetch Token Usage Records from Supabase DB
      let usageQuery = supabase.from('token_usage').select('*');
      if (isEnterpriseAccount) {
        usageQuery = usageQuery.or(`user_id.eq.${user.id},enterprise_id.eq.${user.id}`);
      } else {
        usageQuery = usageQuery.eq('user_id', user.id);
      }

      const { data: usageData, error: usageError } = await usageQuery.order('created_at', { ascending: false });

      if (!usageError && usageData && usageData.length > 0) {
        setDbUsageRecords(usageData);
      } else {
        setDbUsageRecords([]);
      }
    } catch (e) {
      console.error("Error fetching Supabase data:", e);
    } finally {
      setLoadingUsage(false);
    }
  };

  const loadApiKeys = async () => {
    setLoadingKeys(true);
    const { data } = await fetchApiKeys();
    if (data) setApiKeys(data);
    setLoadingKeys(false);
  };

  useEffect(() => {
    if (user && isConfigured) {
      fetchSupabaseData();
      loadApiKeys();
    }
  }, [user, isConfigured, profile?.accountType]);

  // Handle Accept Enterprise Invitation
  const handleAcceptInvitation = async (inv: any) => {
    // 1. Instantly remove invitation from top banner UI state
    setPendingInvitations(prev => prev.filter(i => i.id !== inv.id));

    try {
      // 2. Update invitation status in Supabase DB
      await supabase
        .from('enterprise_invitations')
        .update({ status: 'accepted' })
        .eq('id', inv.id);

      // 3. Link user's profile to enterprise_id & assigned credit_limit
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            enterprise_id: inv.enterprise_id,
            credit_limit: inv.credit_limit
          })
          .eq('id', user.id);
      }

      setCreditLimit(Number(inv.credit_limit));
      setSponsoringEnterpriseName(inv.enterprise_name || 'Enterprise Partner');
      alert(`Accepted Enterprise Invitation! You now have a sponsored compute credit limit of $${inv.credit_limit}.`);
      fetchSupabaseData();
    } catch (err) {
      console.error("Accept invite err:", err);
    }
  };

  // Handle Reject Enterprise Invitation
  const handleRejectInvitation = async (invId: string) => {
    // Instantly remove from top banner UI state
    setPendingInvitations(prev => prev.filter(i => i.id !== invId));
    try {
      await supabase
        .from('enterprise_invitations')
        .update({ status: 'rejected' })
        .eq('id', invId);
    } catch (err) {
      console.error("Reject invite err:", err);
    }
  };

  // Handle Enterprise Sponsor New User
  const handleSponsorUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setIsSponsoringUser(true);
    setSponsorError('');

    try {
      // Create invitation in public.enterprise_invitations
      const { data: invData, error: invErr } = await supabase
        .from('enterprise_invitations')
        .insert({
          enterprise_id: user?.id,
          username: inviteUsername.trim(),
          credit_limit: inviteCreditLimit,
          status: 'pending'
        })
        .select()
        .single();

      setInviteUsername('');
      alert(`Sent enterprise sponsorship invitation to '@${inviteUsername.trim()}' with $${inviteCreditLimit} credit limit!`);
    } catch (err: any) {
      setSponsorError(err.message || 'Error linking user to Enterprise.');
    } finally {
      setIsSponsoringUser(false);
    }
  };

  const handleRemoveSponsorship = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove enterprise sponsorship for this member?')) return;
    setSponsoredMembers(prev => prev.filter(m => m.id !== memberId));
    await supabase.from('profiles').update({ enterprise_id: null, credit_limit: 0 }).eq('id', memberId);
  };

  const handleConfirmTopUp = async () => {
    if (isUpdatingBalance) return;
    setIsUpdatingBalance(true);
    const newBalance = walletBalance + topUpAmount;

    try {
      if (user && isConfigured) {
        await supabase
          .from('profiles')
          .update({ credit_balance: newBalance })
          .eq('id', user.id);

        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            amount: topUpAmount
          });
      }
      setWalletBalance(newBalance);
      setIsTopUpOpen(false);
      alert(`Successfully added +$${topUpAmount} compute credits! New Personal Balance: $${newBalance.toFixed(2)}`);
    } catch (err) {
      console.error("Top up error:", err);
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyLabel.trim()) return;
    const { data } = await createApiKey(newKeyLabel.trim());
    if (data) {
      setApiKeys(prev => [data, ...prev]);
      setNewKeyLabel('');
      setRevealedKeyId(data.id);
    }
  };

  const handleToggleKey = async (key: ApiKeyItem) => {
    const nextStatus = key.status === 'active' ? 'disabled' : 'active';
    setApiKeys(prev => prev.map(k => k.id === key.id ? { ...k, status: nextStatus } : k));
    await toggleApiKeyStatus(key.id, key.status);
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    setApiKeys(prev => prev.filter(k => k.id !== keyId));
    await deleteApiKey(keyId);
  };

  // Compute Processed Analytics Data (Strictly filtered from Supabase DB schema)
  const analyticsData = useMemo(() => {
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = timeRange === '24h' ? `${d.getHours()}:00` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = dbUsageRecords.filter(r => r.created_at && r.created_at.startsWith(dateStr));

      let dbInput = 0;
      let dbOutput = 0;
      let dbCost = 0;
      let apiTokens = 0;
      let chatTokens = 0;

      let smallInput = 0, smallOutput = 0, smallCost = 0;
      let mediumInput = 0, mediumOutput = 0, mediumCost = 0;
      let largeInput = 0, largeOutput = 0, largeCost = 0;

      for (const rec of dayRecords) {
        const inTok = rec.input_tokens || 0;
        const outTok = rec.output_tokens || 0;
        const m = (rec.model_name || rec.model || '').toLowerCase();
        const src = (rec.source || '').toLowerCase();

        const isApiCall = src === 'api_call' || m.includes('api');
        const isLargeModel = m.includes('large');
        const isSmallModel = m.includes('small');
        const inRate = isLargeModel ? 2.50 : isSmallModel ? 0.15 : 0.70;
        const outRate = isLargeModel ? 10.00 : isSmallModel ? 0.60 : 2.80;
        const c = rec.cost || ((inTok * inRate + outTok * outRate) / 1000000);

        if (selectedModelFilter !== 'all') {
          const filterKey = selectedModelFilter.replace('anacleto-', '').toLowerCase();
          if (!m.includes(filterKey)) continue;
        }

        if (selectedSourceFilter !== 'all') {
          if (selectedSourceFilter === 'api_calls' && !isApiCall) continue;
          if (selectedSourceFilter === 'platform_chat' && isApiCall) continue;
        }

        dbInput += inTok;
        dbOutput += outTok;
        dbCost += c;

        if (isApiCall) {
          apiTokens += (inTok + outTok);
        } else {
          chatTokens += (inTok + outTok);
        }

        if (isSmallModel) {
          smallInput += inTok;
          smallOutput += outTok;
          smallCost += c;
        } else if (isLargeModel) {
          largeInput += inTok;
          largeOutput += outTok;
          largeCost += c;
        } else {
          mediumInput += inTok;
          mediumOutput += outTok;
          mediumCost += c;
        }
      }

      data.push({
        date: label,
        inputTokens: dbInput,
        outputTokens: dbOutput,
        totalTokens: dbInput + dbOutput,
        apiTokens,
        chatTokens,
        cost: Number(dbCost.toFixed(4)),
        smallInput, smallOutput, smallCost,
        mediumInput, mediumOutput, mediumCost,
        largeInput, largeOutput, largeCost,
      });
    }

    return data;
  }, [timeRange, selectedModelFilter, selectedSourceFilter, dbUsageRecords]);

  // Aggregate Totals
  const totals = useMemo(() => {
    const totalInput = analyticsData.reduce((acc, curr) => acc + curr.inputTokens, 0);
    const totalOutput = analyticsData.reduce((acc, curr) => acc + curr.outputTokens, 0);
    const totalCost = analyticsData.reduce((acc, curr) => acc + curr.cost, 0);
    const apiTokens = analyticsData.reduce((acc, curr) => acc + curr.apiTokens, 0);
    const chatTokens = analyticsData.reduce((acc, curr) => acc + curr.chatTokens, 0);
    const requestsCount = analyticsData.reduce((acc, curr) => acc + (curr.totalTokens > 0 ? Math.ceil(curr.totalTokens / 500) : 0), 0);

    return {
      totalInput,
      totalOutput,
      totalTokens: totalInput + totalOutput,
      totalCost: Number(totalCost.toFixed(2)),
      apiTokens,
      chatTokens,
      requestsCount,
      avgLatency: requestsCount > 0 ? '14ms' : '0ms',
    };
  }, [analyticsData]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'API Tokens', 'Chat Tokens', 'Estimated Cost ($)'];
    const rows = analyticsData.map(d => [d.date, d.inputTokens, d.outputTokens, d.totalTokens, d.apiTokens, d.chatTokens, d.cost]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `anacleto_ai_analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSponsored = Boolean(sponsoringEnterpriseName);
  const sponsoredRemaining = isSponsored ? Math.max(0, creditLimit - totals.totalCost) : 0;

  return (
    <div className="relative pt-24 pb-20 overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-[#FFD54F]/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* HEADER & ACCOUNT STATUS */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                profile?.accountType === 'enterprise'
                  ? 'bg-[#FFD54F]/15 border border-[#FFD54F]/40 text-[#FFD54F]'
                  : profile?.accountType === 'developer'
                  ? 'bg-blue-500/15 border border-blue-500/40 text-blue-400'
                  : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
              }`}>
                {profile?.accountType === 'enterprise' ? 'Enterprise Tier' : profile?.accountType === 'developer' ? 'Developer Tier' : 'Standard User'}
              </span>

              {isSponsored && (
                <span className="px-3.5 py-1 rounded-full bg-[#FFD54F]/15 border border-[#FFD54F]/50 text-[#FFD54F] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#FFD54F]/10">
                  <Building2 className="w-3.5 h-3.5 text-[#FFD54F]" />
                  Sponsored by {sponsoringEnterpriseName || 'Enterprise Partner'}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] uppercase tracking-tight">
              {profile?.enterpriseName || profile?.fullName || profile?.username || user?.email?.split('@')[0] || 'Sovereign Account'}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs sm:text-sm font-mono text-[#BDBDBD]">
              <span className="text-[#FFD54F]">@{profile?.username || user?.email?.split('@')[0] || 'username'}</span>
              {sponsoringEnterpriseName && (
                <>
                  <span className="text-[#666666]">•</span>
                  <span className="text-[#F5F5F5] font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#FFD54F]" />
                    Enterprise Sponsor: {sponsoringEnterpriseName}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchSupabaseData}
              className="p-2.5 rounded-xl bg-[#121212] hover:bg-[#252525] border border-[#333333] text-[#FFD54F] transition-all cursor-pointer"
              title="Refresh Supabase Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsage ? 'animate-spin' : ''}`} />
            </button>

            {profile?.accountType === 'developer' && (
              <button 
                onClick={() => onNavigate('api-docs')}
                className="px-4 py-2.5 rounded-xl bg-[#121212] hover:bg-[#252525] border border-[#333333] text-[#F5F5F5] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-[#FFD54F]" />
                API Console
              </button>
            )}
            
            <button 
              onClick={() => onNavigate('chat')}
              className="px-4 py-2.5 rounded-xl bg-[#FFD54F] hover:bg-[#FFCA28] text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-[#FFD54F]/10 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              Try Models
            </button>
          </div>
        </div>

        {/* PENDING ENTERPRISE INVITATIONS BANNER */}
        {pendingInvitations.length > 0 && (
          <div className="bg-[#1A1A1A] border-2 border-[#FFD54F]/60 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-[#FFD54F]" />
              <div>
                <h3 className="text-base font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Pending Enterprise Sponsorship Invitation
                </h3>
                <p className="text-xs text-[#BDBDBD] mt-0.5">
                  An Enterprise partner has invited you to join their sponsored compute pool.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="p-4 rounded-xl bg-[#121212] border border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#FFD54F] uppercase">Assigned Credit Limit:</span>
                    <span className="text-base font-mono font-extrabold text-white ml-2">${inv.credit_limit} / month</span>
                    <p className="text-[11px] text-[#666666] font-mono mt-0.5">
                      Invited: {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptInvitation(inv)}
                      className="px-4 py-2 rounded-xl bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#FFD54F]/10"
                    >
                      <Check className="w-4 h-4" /> Accept Sponsorship
                    </button>
                    <button
                      onClick={() => handleRejectInvitation(inv.id)}
                      className="px-3 py-2 rounded-xl bg-[#252525] hover:bg-red-500/20 hover:text-red-400 border border-[#333333] text-[#BDBDBD] text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 1: EXPANDABLE ANALYTICS & USAGE FILTER BAR */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#333333]">
            <div>
              <h2 className="text-xl font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#FFD54F]" />
                {profile?.accountType === 'enterprise' ? 'Enterprise Consolidated Usage' : 'Usage & Token Analytics'}
              </h2>
              <p className="text-xs text-[#BDBDBD] mt-1">Real-time metrics fetched from Supabase `token_usage` table.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-[#121212] border border-[#333333] rounded-xl p-1 text-xs">
                {(['24h', '7d', '30d', 'ytd'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      timeRange === t ? 'bg-[#FFD54F] text-black' : 'text-[#BDBDBD] hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <select
                value={selectedModelFilter}
                onChange={(e) => setSelectedModelFilter(e.target.value)}
                className="bg-[#121212] border border-[#333333] text-[#F5F5F5] text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-[#FFD54F]"
              >
                <option value="all">All Models</option>
                <option value="anacleto-small">Anacleto Small</option>
                <option value="anacleto-medium">Anacleto Medium</option>
                <option value="anacleto-large">Anacleto Large</option>
              </select>

              {profile?.accountType !== 'standard' && (
                <select
                  value={selectedSourceFilter}
                  onChange={(e) => setSelectedSourceFilter(e.target.value as any)}
                  className="bg-[#121212] border border-[#333333] text-[#F5F5F5] text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-[#FFD54F]"
                >
                  <option value="all">All Sources</option>
                  <option value="api_calls">API Calls (`anc_live_...`)</option>
                  <option value="platform_chat">Platform Chat</option>
                </select>
              )}

              <button
                onClick={handleExportCSV}
                className="p-2 rounded-xl bg-[#121212] hover:bg-[#252525] border border-[#333333] text-[#FFD54F] transition-all cursor-pointer"
                title="Export CSV Usage Data"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
                className="p-2 rounded-xl bg-[#121212] hover:bg-[#252525] border border-[#333333] text-[#BDBDBD] transition-all cursor-pointer"
                title={isAnalyticsExpanded ? "Collapse Analytics" : "Expand Analytics"}
              >
                {isAnalyticsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#121212] border border-[#333333] rounded-xl p-4">
              <p className="text-[#666666] text-[11px] font-bold uppercase tracking-wider">Total Tokens</p>
              <p className="text-xl sm:text-2xl font-mono font-bold text-[#F5F5F5] mt-1">{totals.totalTokens.toLocaleString()}</p>
              <p className="text-[10px] text-[#BDBDBD] mt-1">In: {totals.totalInput.toLocaleString()} | Out: {totals.totalOutput.toLocaleString()}</p>
            </div>

            <div className="bg-[#121212] border border-[#333333] rounded-xl p-4">
              <p className="text-[#666666] text-[11px] font-bold uppercase tracking-wider">Estimated Cost</p>
              <p className="text-xl sm:text-2xl font-mono font-bold text-[#FFD54F] mt-1">${totals.totalCost.toFixed(2)}</p>
              <p className="text-[10px] text-emerald-400 mt-1">
                {isSponsored ? `Priority: Billed to ${sponsoringEnterpriseName || 'Enterprise'}` : 'Deducted from Personal Balance'}
              </p>
            </div>

            <div className="bg-[#121212] border border-[#333333] rounded-xl p-4">
              <p className="text-[#666666] text-[11px] font-bold uppercase tracking-wider">Total Requests</p>
              <p className="text-xl sm:text-2xl font-mono font-bold text-[#F5F5F5] mt-1">{totals.requestsCount.toLocaleString()}</p>
              <p className="text-[10px] text-[#BDBDBD] mt-1">Avg Latency: {totals.avgLatency}</p>
            </div>

            <div className="bg-[#121212] border border-[#333333] rounded-xl p-4">
              <p className="text-[#666666] text-[11px] font-bold uppercase tracking-wider">Channel Split</p>
              <p className="text-sm font-semibold text-[#F5F5F5] mt-1">
                {totals.totalTokens === 0 ? '0% API / 0% Chat' : `${Math.round((totals.apiTokens / totals.totalTokens) * 100)}% API / ${Math.round((totals.chatTokens / totals.totalTokens) * 100)}% Chat`}
              </p>
              <div className="w-full bg-[#252525] h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-[#FFD54F] h-full" style={{ width: totals.totalTokens === 0 ? '0%' : `${Math.round((totals.apiTokens / totals.totalTokens) * 100)}%` }}></div>
              </div>
            </div>
          </div>

          {isAnalyticsExpanded && (
            <div className="space-y-6 pt-4 animate-in fade-in duration-300">
              <div className="bg-[#121212] border border-[#333333] rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">Token Volume Over Time</h4>
                  <span className="text-[10px] font-mono text-[#666666]">Tokens / Day</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData}>
                      <defs>
                        <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFD54F" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#FFD54F" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252525" />
                      <XAxis dataKey="date" stroke="#666666" fontSize={11} />
                      <YAxis stroke="#666666" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333333', borderRadius: '8px', color: '#F5F5F5', fontSize: '12px' }} 
                      />
                      <Area type="monotone" dataKey="totalTokens" stroke="#FFD54F" fillOpacity={1} fill="url(#tokenGrad)" name="Total Tokens" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#121212] border border-[#333333] rounded-xl p-4 sm:p-6">
                <h4 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider mb-4">Model Breakdown & Billing Ledger</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#BDBDBD]">
                    <thead className="bg-[#1A1A1A] text-[#FFD54F] font-mono uppercase text-[11px] border-b border-[#333333]">
                      <tr>
                        <th className="p-3">Model</th>
                        <th className="p-3">Channel Source</th>
                        <th className="p-3">Input Tokens</th>
                        <th className="p-3">Output Tokens</th>
                        <th className="p-3">Rate (1M In / 1M Out)</th>
                        <th className="p-3">Est. Cost ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#252525]">
                      <tr className="hover:bg-[#1A1A1A]">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-[#FFD54F]" /> Anacleto Small
                        </td>
                        <td className="p-3 font-mono text-[#666666]">Platform Chat & API</td>
                        <td className="p-3 font-mono">{analyticsData.reduce((a, c) => a + c.smallInput, 0).toLocaleString()}</td>
                        <td className="p-3 font-mono">{analyticsData.reduce((a, c) => a + c.smallOutput, 0).toLocaleString()}</td>
                        <td className="p-3 font-mono text-[#666666]">$0.15 / $0.60</td>
                        <td className="p-3 font-mono text-[#FFD54F]">${analyticsData.reduce((a, c) => a + c.smallCost, 0).toFixed(3)}</td>
                      </tr>

                      <tr className="hover:bg-[#1A1A1A]">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-[#FFD54F]" /> Anacleto Medium
                        </td>
                        <td className="p-3 font-mono text-[#666666]">Platform Chat & API</td>
                        <td className="p-3 font-mono">{analyticsData.reduce((a, c) => a + c.mediumInput, 0).toLocaleString()}</td>
                        <td className="p-3 font-mono">{analyticsData.reduce((a, c) => a + c.mediumOutput, 0).toLocaleString()}</td>
                        <td className="p-3 font-mono text-[#666666]">$0.70 / $2.80</td>
                        <td className="p-3 font-mono text-[#FFD54F]">${analyticsData.reduce((a, c) => a + c.mediumCost, 0).toFixed(3)}</td>
                      </tr>

                      <tr className="hover:bg-[#1A1A1A]">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-[#FFD54F]" /> Anacleto Large
                        </td>
                        <td className="p-3 font-mono text-[#666666]">Platform Chat & API</td>
                        <td className="p-3 font-mono">{analyticsData.reduce((a, c) => a + c.largeInput, 0).toLocaleString()}</td>
                        <td className="p-3 font-mono">{analyticsData.reduce((a, c) => a + c.largeOutput, 0).toLocaleString()}</td>
                        <td className="p-3 font-mono text-[#666666]">$2.50 / $10.00</td>
                        <td className="p-3 font-mono text-[#FFD54F]">${analyticsData.reduce((a, c) => a + c.largeCost, 0).toFixed(3)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: DUAL CREDITS & BILLING LEDGER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          <div className="lg:col-span-6 bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-[#333333] pb-4 mb-4">
                <h3 className="text-lg font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#FFD54F]" />
                  Compute Credit Balances
                </h3>
                <span className="px-2.5 py-1 rounded bg-[#FFD54F]/10 border border-[#FFD54F]/30 text-[#FFD54F] text-[10px] font-mono font-bold uppercase">
                  Supabase DB Synced
                </span>
              </div>

              <div className="space-y-6">
                {/* 1. PERSONAL CREDIT METER */}
                <div className="bg-[#121212] p-4 rounded-xl border border-[#333333]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#666666] text-xs font-bold uppercase tracking-wider">
                      Personal Compute Balance
                    </span>
                    <span className="text-[10px] font-mono text-[#666666]">Top-Up Balance</span>
                  </div>
                  <p className="text-3xl font-mono font-extrabold text-[#FFD54F]">${walletBalance.toFixed(2)}</p>
                  <p className="text-[10px] text-[#BDBDBD] mt-1">
                    {isSponsored ? 'Preserved as backup when Enterprise pool is exhausted.' : 'Used for all completions and API calls.'}
                  </p>
                </div>

                {/* 2. SPONSORED ENTERPRISE POOL METER */}
                {isSponsored && (
                  <div className="bg-[#121212] p-4 rounded-xl border-2 border-[#FFD54F]/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#FFD54F] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-[#FFD54F]" />
                        Sponsored Pool ({sponsoringEnterpriseName || 'Enterprise'})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase font-mono border border-emerald-500/30">
                        Priority 1
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[#666666] text-[10px] font-bold uppercase">Assigned Limit</span>
                        <p className="text-lg font-mono font-bold text-white">${creditLimit.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-[#666666] text-[10px] font-bold uppercase">Period Spend</span>
                        <p className="text-lg font-mono font-bold text-[#FFD54F]">${totals.totalCost.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <div className="flex justify-between text-[11px] font-mono text-[#BDBDBD] mb-1">
                        <span>Remaining Allowance:</span>
                        <span className="font-bold text-emerald-400">${sponsoredRemaining.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-[#252525] h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#FFD54F] h-full transition-all" 
                          style={{ width: creditLimit > 0 ? `${Math.min(100, (totals.totalCost / creditLimit) * 100)}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsTopUpOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFD54F]/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Top-Up Personal Credits
            </button>
          </div>

          <div className="lg:col-span-6 bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#333333] pb-4 mb-4">
                <h3 className="text-lg font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#FFD54F]" />
                  Model Pricing Matrix
                </h3>
                <span className="text-xs text-[#666666] font-mono">Per 1,000,000 Tokens</span>
              </div>

              <div className="space-y-3 my-4">
                <div className="p-3.5 rounded-xl bg-[#121212] border border-[#333333] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-[#FFD54F]" />
                    <span className="text-xs font-bold text-[#F5F5F5]">Anacleto Small</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-[#F5F5F5] font-bold">$0.15</span> <span className="text-[#666666]">In</span> / <span className="text-[#FFD54F] font-bold">$0.60</span> <span className="text-[#666666]">Out</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#121212] border border-[#333333] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-[#FFD54F]" />
                    <span className="text-xs font-bold text-[#F5F5F5]">Anacleto Medium</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-[#F5F5F5] font-bold">$0.70</span> <span className="text-[#666666]">In</span> / <span className="text-[#FFD54F] font-bold">$2.80</span> <span className="text-[#666666]">Out</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#121212] border border-[#333333] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#FFD54F]" />
                    <span className="text-xs font-bold text-[#F5F5F5]">Anacleto Large</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-[#F5F5F5] font-bold">$2.50</span> <span className="text-[#666666]">In</span> / <span className="text-[#FFD54F] font-bold">$10.00</span> <span className="text-[#666666]">Out</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#333333] text-center">
              <span className="text-[11px] font-mono text-[#666666]">
                Automatic volume discounts applied over 100M tokens/month.
              </span>
            </div>
          </div>

        </div>

        {/* SECTION 3: TAILORED PANELS BY ACCOUNT TYPE */}
        {profile?.accountType === 'enterprise' && (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#FFD54F]" />
                  Enterprise Sponsored Members & Credit Allocations
                </h3>
                <p className="text-xs text-[#BDBDBD] mt-0.5">Sponsor users to give them compute access billed to your enterprise credit pool.</p>
              </div>
            </div>

            <form onSubmit={handleSponsorUser} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#121212] p-4 rounded-xl border border-[#333333]">
              <div className="flex-1">
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Enter User Email or Username (e.g. dev@company.com)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1A1A1A] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-xs focus:outline-none focus:border-[#FFD54F]"
                />
              </div>
              <div className="w-full sm:w-48">
                <input
                  type="number"
                  value={inviteCreditLimit}
                  onChange={(e) => setInviteCreditLimit(Number(e.target.value))}
                  placeholder="Credit Limit ($)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1A1A1A] border border-[#333333] text-[#F5F5F5] text-xs focus:outline-none focus:border-[#FFD54F] font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSponsoringUser || !inviteUsername.trim()}
                className="px-5 py-2.5 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider shrink-0 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#FFD54F]/10"
              >
                {isSponsoringUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Sponsor User
              </button>
            </form>

            {sponsorError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {sponsorError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#BDBDBD]">
                <thead className="bg-[#121212] text-[#FFD54F] font-mono uppercase text-[11px] border-b border-[#333333]">
                  <tr>
                    <th className="p-3">User / Email</th>
                    <th className="p-3">Account Tier</th>
                    <th className="p-3">Assigned Monthly Limit ($)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252525]">
                  {sponsoredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-[#666666]">
                        No sponsored team members yet. Enter a user email above to sponsor their compute usage.
                      </td>
                    </tr>
                  ) : (
                    sponsoredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-[#252525]/40 transition-colors">
                        <td className="p-3">
                          <p className="font-semibold text-white">@{m.username || 'username'}</p>
                          <p className="text-[10px] font-mono text-[#666666]">Member ID: {m.id ? m.id.substring(0, 8) + '...' : ''}</p>
                        </td>
                        <td className="p-3 uppercase font-mono text-[#FFD54F]">{m.account_type || 'User'}</td>
                        <td className="p-3 font-mono font-bold text-white">${(m.credit_limit || 100).toFixed(2)}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <UserCheck className="w-3 h-3" /> Sponsored
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveSponsorship(m.id)}
                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Remove Enterprise Sponsorship"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(profile?.accountType === 'developer' || profile?.accountType === 'enterprise') && (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-[#FFD54F]" />
                  Developer API Keys & Rate Limits
                </h3>
                <p className="text-xs text-[#BDBDBD] mt-0.5 font-mono">Synced with `public.api_keys` in Supabase Database.</p>
              </div>

              <button
                onClick={() => onNavigate('api-docs')}
                className="px-4 py-2 rounded-xl bg-[#121212] hover:bg-[#252525] border border-[#333333] text-[#FFD54F] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              >
                Launch Full API Playground <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="flex items-center gap-2 max-w-lg">
              <input
                type="text"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                placeholder="New Key Name (e.g. Staging Server)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-xs focus:outline-none focus:border-[#FFD54F]"
              />
              <button
                type="submit"
                disabled={!newKeyLabel.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#FFD54F] hover:bg-[#FFCA28] disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer"
              >
                Create Key
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#BDBDBD]">
                <thead className="bg-[#121212] text-[#FFD54F] font-mono uppercase text-[11px] border-b border-[#333333]">
                  <tr>
                    <th className="p-3">Key Name</th>
                    <th className="p-3">Secret Key (`anc_live_...`)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252525]">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-[#666666]">
                        No active API keys found. Generate your first developer key above.
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-[#252525]/40 transition-colors">
                        <td className="p-3 font-semibold text-white">{k.keyName}</td>
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-2">
                            <span>{revealedKeyId === k.id ? k.keyValue : `${k.keyValue.substring(0, 12)}••••••••••••`}</span>
                            <button
                              onClick={() => setRevealedKeyId(revealedKeyId === k.id ? null : k.id)}
                              className="text-[#666666] hover:text-white"
                            >
                              {revealedKeyId === k.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(k.keyValue);
                                alert('Key copied to clipboard!');
                              }}
                              className="text-[#666666] hover:text-[#FFD54F]"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            k.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${k.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                            {k.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[#666666]">{new Date(k.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleToggleKey(k)}
                            className="p-1.5 text-amber-400 hover:bg-amber-400/10 rounded transition-colors"
                            title="Toggle Active/Disabled"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteKey(k.id)}
                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {profile?.accountType === 'enterprise' && (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-[#333333] pb-4">
              <h3 className="text-lg font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <Server className="w-5 h-5 text-[#FFD54F]" />
                Sovereign Datacenter Node Telemetry & SLA
              </h3>
              <p className="text-xs text-[#BDBDBD] mt-0.5">Dedicated infrastructure telemetry and enterprise access controls.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#121212] p-4 rounded-xl border border-[#333333]">
                <span className="text-[#666666] text-[10px] font-bold uppercase">Dedicated GPU Load</span>
                <p className="text-2xl font-mono text-[#F5F5F5] mt-1">78.4%</p>
                <div className="w-full bg-[#252525] h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-[#FFD54F] h-full" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div className="bg-[#121212] p-4 rounded-xl border border-[#333333]">
                <span className="text-[#666666] text-[10px] font-bold uppercase">Air-Gap Status</span>
                <p className="text-2xl font-mono text-emerald-400 mt-1">100% Isolated</p>
                <span className="text-[10px] text-[#666666] mt-1 block">Zero Outbound Connectivity</span>
              </div>

              <div className="bg-[#121212] p-4 rounded-xl border border-[#333333]">
                <span className="text-[#666666] text-[10px] font-bold uppercase">SLA Uptime Commitment</span>
                <p className="text-2xl font-mono text-[#F5F5F5] mt-1">99.99%</p>
                <span className="text-[10px] text-emerald-400 mt-1 block">Guaranteed SLA Active</span>
              </div>
            </div>
          </div>
        )}

        {profile?.accountType === 'standard' && (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD54F]/10 text-[#FFD54F] text-xs font-bold uppercase mb-3">
                <Sparkles className="w-4 h-4" /> Developer Upgrade Available
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] uppercase">Unlock Developer API Keys & Streaming Access</h3>
              <p className="text-xs text-[#BDBDBD] mt-1 max-w-xl">
                Upgrade your account to Developer Tier to generate REST & SSE streaming API keys, access the API console, and integrate Anacleto Small, Medium, and Large into your software applications.
              </p>
            </div>

            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3 rounded-xl bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-lg shadow-[#FFD54F]/20 cursor-pointer"
            >
              Upgrade to Developer Tier
            </button>
          </div>
        )}

      </div>

      {/* TOP-UP CREDIT MODAL */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5] uppercase flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#FFD54F]" /> Top-Up Personal Credits
              </h3>
              <button onClick={() => setIsTopUpOpen(false)} className="text-[#666666] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#BDBDBD] mb-2">Select Credit Top-up Amount</label>
                <div className="grid grid-cols-3 gap-3">
                  {[25, 50, 100, 250, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                        topUpAmount === amt 
                          ? 'bg-[#FFD54F] text-black border-[#FFD54F]' 
                          : 'bg-[#121212] text-[#F5F5F5] border-[#333333] hover:border-[#FFD54F]/50'
                      }`}
                    >
                      +${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#333333] text-xs text-[#BDBDBD] space-y-1 font-mono">
                <div className="flex justify-between"><span>Added Credits:</span> <span className="text-[#FFD54F] font-bold">+${topUpAmount}</span></div>
                <div className="flex justify-between"><span>New Personal Balance:</span> <span className="text-[#F5F5F5] font-bold">${(walletBalance + topUpAmount).toFixed(2)}</span></div>
              </div>

              <button
                onClick={handleConfirmTopUp}
                disabled={isUpdatingBalance}
                className="w-full py-3 px-4 rounded-xl bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#FFD54F]/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isUpdatingBalance ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Confirm Compute Top-Up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
