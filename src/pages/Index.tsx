"use client";

import React, { useState, useEffect } from 'react';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { showSuccess, showError } from "@/utils/toast";
import { Camera, Upload } from 'lucide-react';

interface Trade {
  id: string;
  date: string;
  pair: string;
  session: string;
  type: 'long' | 'short';
  setup: 'PT-POF' | 'PT-COF' | 'CT-POF' | 'CT-COF';
  h4: 'pro' | 'counter';
  m15: 'extreme refined' | 'flip refined' | 'overall POI';
  entry: '1m ofra' | '1st tap sweep' | '1st tap';
  result: 'win' | 'loss';
  riskReward: string;
  notes: string;
  screenshots?: {
    daily?: string;
    h4?: string;
    m15?: string;
    m1?: string;
  };
}

const Index = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: '',
    pair: '',
    session: '',
    type: '' as 'long' | 'short' | '',
    setup: '' as 'PT-POF' | 'PT-COF' | 'CT-POF' | 'CT-COF' | '',
    h4: '' as 'pro' | 'counter' | '',
    m15: '' as 'extreme refined' | 'flip refined' | 'overall POI' | '',
    entry: '' as '1m ofra' | '1st tap sweep' | '1st tap' | '',
    result: '' as 'win' | 'loss' | '',
    riskReward: '',
    notes: '',
    screenshots: {
      daily: '',
      h4: '',
      m15: '',
      m1: ''
    }
  });

  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD'];
  const sessions = ['London', 'New York', 'Tokyo', 'Sydney'];
  const setups = ['PT-POF', 'PT-COF', 'CT-POF', 'CT-COF'];
  const h4Options = ['pro', 'counter'];
  const m15Options = ['extreme refined', 'flip refined', 'overall POI'];
  const entryOptions = ['1m ofra', '1st tap sweep', '1st tap'];
  const results = ['win', 'loss'];

  useEffect(() => {
    const savedTrades = localStorage.getItem('forexTrades');
    if (savedTrades) {
      setTrades(JSON.parse(savedTrades));
    }
  }, []);

  useEffect(() => {
    if (trades.length > 0) {
      calculateAnalytics();
    }
  }, [trades]);

  const calculateAnalytics = () => {
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'loss').length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
    
    const avgRiskReward = trades.reduce((sum, trade) => {
      const rr = parseFloat(trade.riskReward);
      return sum + (isNaN(rr) ? 0 : rr);
    }, 0) / totalTrades || 0;

    const setupStats = setups.map(setup => {
      const setupTrades = trades.filter(t => t.setup === setup);
      const setupWins = setupTrades.filter(t => t.result === 'win').length;
      return {
        setup,
        total: setupTrades.length,
        wins: setupWins,
        winRate: setupTrades.length > 0 ? ((setupWins / setupTrades.length) * 100).toFixed(1) : 0
      };
    });

    const pairStats = pairs.map(pair => {
      const pairTrades = trades.filter(t => t.pair === pair);
      const pairWins = pairTrades.filter(t => t.result === 'win').length;
      return {
        pair,
        total: pairTrades.length,
        wins: pairWins,
        winRate: pairTrades.length > 0 ? ((pairWins / pairTrades.length) * 100).toFixed(1) : 0
      };
    }).filter(stat => stat.total > 0);

    const monthlyData = trades.reduce((acc, trade) => {
      const month = new Date(trade.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { wins: 0, losses: 0 };
      }
      acc[month][trade.result]++;
      return acc;
    }, {} as Record<string, { wins: number; losses: number }>);

    const monthlyChartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      wins: data.wins,
      losses: data.losses,
      total: data.wins + data.losses
    }));

    const weeklyData = trades.reduce((acc, trade) => {
      const date = new Date(trade.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!acc[weekKey]) {
        acc[weekKey] = { wins: 0, losses: 0 };
      }
      acc[weekKey][trade.result]++;
      return acc;
    }, {} as Record<string, { wins: number; losses: number }>);

    const weeklyChartData = Object.entries(weeklyData).map(([week, data]) => ({
      week,
      wins: data.wins,
      losses: data.losses,
      total: data.wins + data.losses
    }));

    const detailedPairAnalysis = pairs.map(pair => {
      const pairTrades = trades.filter(t => t.pair === pair);
      const pairWins = pairTrades.filter(t => t.result === 'win').length;
      const avgRR = pairTrades.reduce((sum, trade) => {
        const rr = parseFloat(trade.riskReward);
        return sum + (isNaN(rr) ? 0 : rr);
      }, 0) / pairTrades.length || 0;
      
      const setupBreakdown = setups.map(setup => {
        const setupTrades = pairTrades.filter(t => t.setup === setup);
        const setupWins = setupTrades.filter(t => t.result === 'win').length;
        return {
          setup,
          total: setupTrades.length,
          wins: setupWins,
          winRate: setupTrades.length > 0 ? ((setupWins / setupTrades.length) * 100).toFixed(1) : 0
        };
      });

      return {
        pair,
        total: pairTrades.length,
        wins: pairWins,
        winRate: pairTrades.length > 0 ? ((pairWins / pairTrades.length) * 100).toFixed(1) : 0,
        avgRiskReward: avgRR.toFixed(2),
        setupBreakdown
      };
    }).filter(stat => stat.total > 0);

    const detailedSetupAnalysis = setups.map(setup => {
      const setupTrades = trades.filter(t => t.setup === setup);
      const setupWins = setupTrades.filter(t => t.result === 'win').length;
      const avgRR = setupTrades.reduce((sum, trade) => {
        const rr = parseFloat(trade.riskReward);
        return sum + (isNaN(rr) ? 0 : rr);
      }, 0) / setupTrades.length || 0;
      
      const pairBreakdown = pairs.map(pair => {
        const pairTrades = setupTrades.filter(t => t.pair === pair);
        const pairWins = pairTrades.filter(t => t.result === 'win').length;
        return {
          pair,
          total: pairTrades.length,
          wins: pairWins,
          winRate: pairTrades.length > 0 ? ((pairWins / pairTrades.length) * 100).toFixed(1) : 0
        };
      });

      return {
        setup,
        total: setupTrades.length,
        wins: setupWins,
        winRate: setupTrades.length > 0 ? ((setupWins / setupTrades.length) * 100).toFixed(1) : 0,
        avgRiskReward: avgRR.toFixed(2),
        pairBreakdown
      };
    }).filter(stat => stat.total > 0);

    setAnalytics({
      totalTrades,
      wins,
      losses,
      winRate,
      avgRiskReward: avgRiskReward.toFixed(2),
      setupStats,
      pairStats,
      monthlyChartData,
      weeklyChartData,
      detailedPairAnalysis,
      detailedSetupAnalysis
    });
  };

  const handleScreenshotUpload = (timeframe: keyof typeof formData.screenshots, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setFormData(prev => ({
        ...prev,
        screenshots: {
          ...prev.screenshots,
          [timeframe]: base64
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (timeframe: keyof typeof formData.screenshots, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScreenshotUpload(timeframe, file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.pair || !formData.type || !formData.result) {
      showError('Please fill in all required fields');
      return;
    }

    const newTrade: Trade = {
      id: Date.now().toString(),
      date: formData.date,
      pair: formData.pair,
      session: formData.session,
      type: formData.type as 'long' | 'short',
      setup: formData.setup as 'PT-POF' | 'PT-COF' | 'CT-POF' | 'CT-COF',
      h4: formData.h4 as 'pro' | 'counter',
      m15: formData.m15 as 'extreme refined' | 'flip refined' | 'overall POI',
      entry: formData.entry as '1m ofra' | '1st tap sweep' | '1st tap',
      result: formData.result as 'win' | 'loss',
      riskReward: formData.riskReward,
      notes: formData.notes,
      screenshots: formData.screenshots
    };

    const updatedTrades = [...trades, newTrade];
    setTrades(updatedTrades);
    localStorage.setItem('forexTrades', JSON.stringify(updatedTrades));
    
    showSuccess('Trade added successfully!');
    
    setFormData({
      date: '',
      pair: '',
      session: '',
      type: '' as 'long' | 'short' | '',
      setup: '' as 'PT-POF' | 'PT-COF' | 'CT-POF' | 'CT-COF' | '',
      h4: '' as 'pro' | 'counter' | '',
      m15: '' as 'extreme refined' | 'flip refined' | 'overall POI' | '',
      entry: '' as '1m ofra' | '1st tap sweep' | '1st tap' | '',
      result: '' as 'win' | 'loss' | '',
      riskReward: '',
      notes: '',
      screenshots: {
        daily: '',
        h4: '',
        m15: '',
        m1: ''
      }
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const deleteTrade = (id: string) => {
    const updatedTrades = trades.filter(trade => trade.id !== id);
    setTrades(updatedTrades);
    localStorage.setItem('forexTrades', JSON.stringify(updatedTrades));
    showSuccess('Trade deleted');
  };

  const getOpacity = (elementId: string) => {
    if (hoveredElement === elementId) return 1;
    return 0.2;
  };

  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Advanced Forex Trading Journal
          </h1>
          <p className="text-gray-400">Track your trades and analyze your performance</p>
        </div>

        <Tabs defaultValue="journal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="journal">Trade Entry</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="journal">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl">Add New Trade</CardTitle>
                  <CardDescription className="text-gray-400">
                    Record your forex trade details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date" className="text-gray-300">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="pair" className="text-gray-300">Pair</Label>
                        <Select value={formData.pair} onValueChange={(value) => handleInputChange('pair', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select pair" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {pairs.map(pair => (
                              <SelectItem key={pair} value={pair} className="text-white">{pair}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="session" className="text-gray-300">Session</Label>
                        <Select value={formData.session} onValueChange={(value) => handleInputChange('session', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select session" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {sessions.map(session => (
                              <SelectItem key={session} value={session} className="text-white">{session}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="type" className="text-gray-300">Type</Label>
                        <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="long" className="text-white">Long</SelectItem>
                            <SelectItem value="short" className="text-white">Short</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="setup" className="text-gray-300">Setup</Label>
                        <Select value={formData.setup} onValueChange={(value) => handleInputChange('setup', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select setup" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {setups.map(setup => (
                              <SelectItem key={setup} value={setup} className="text-white">{setup}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="h4" className="text-gray-300">4H - Pro/Counter</Label>
                        <Select value={formData.h4} onValueChange={(value) => handleInputChange('h4', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select 4H" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {h4Options.map(option => (
                              <SelectItem key={option} value={option} className="text-white">{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="m15" className="text-gray-300">15m - POI</Label>
                        <Select value={formData.m15} onValueChange={(value) => handleInputChange('m15', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select 15m" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {m15Options.map(option => (
                              <SelectItem key={option} value={option} className="text-white">{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="entry" className="text-gray-300">Entry</Label>
                        <Select value={formData.entry} onValueChange={(value) => handleInputChange('entry', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select entry" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {entryOptions.map(option => (
                              <SelectItem key={option} value={option} className="text-white">{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="result" className="text-gray-300">Result</Label>
                        <Select value={formData.result} onValueChange={(value) => handleInputChange('result', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="win" className="text-white">Win</SelectItem>
                            <SelectItem value="loss" className="text-white">Loss</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="riskReward" className="text-gray-300">Risk/Reward</Label>
                        <Input
                          id="riskReward"
                          type="text"
                          placeholder="e.g., 1:2"
                          value={formData.riskReward}
                          onChange={(e) => handleInputChange('riskReward', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Screenshot Upload Section */}
                    <div className="space-y-4">
                      <Label className="text-gray-300">Trade Screenshots</Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { key: 'daily', label: 'Daily' },
                          { key: 'h4', label: '4H' },
                          { key: 'm15', label: '15M' },
                          { key: 'm1', label: '1M' }
                        ].map(({ key, label }) => (
                          <div 
                            key={key}
                            className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-blue-500 transition-all duration-300"
                          >
                            <div className="aspect-square flex items-center justify-center p-4">
                              {formData.screenshots[key as keyof typeof formData.screenshots] ? (
                                <img 
                                  src={formData.screenshots[key as keyof typeof formData.screenshots]} 
                                  alt={`${label} chart`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="text-center">
                                  <Camera className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                                  <p className="text-xs text-gray-500">{label}</p>
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <label 
                                htmlFor={`screenshot-${key}`}
                                className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm transition-colors duration-200 flex items-center gap-1"
                              >
                                <Upload className="w-4 h-4" />
                                Upload
                              </label>
                              <input
                                id={`screenshot-${key}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(key as keyof typeof formData.screenshots, e)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-gray-300">Notes</Label>
                      <textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                        rows={3}
                        placeholder="Add any additional notes..."
                      />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Add Trade
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl">Recent Trades</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your latest trading entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {trades.slice(-5).reverse().map(trade => (
                      <div key={trade.id} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium">{trade.pair}</span>
                            <Badge variant={trade.type === 'long' ? 'default' : 'secondary'} className="ml-2">
                              {trade.type.toUpperCase()}
                            </Badge>
                          </div>
                          <Badge variant={trade.result === 'win' ? 'default' : 'destructive'}>
                            {trade.result.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          <p>{trade.setup} | {trade.h4} | {trade.m15}</p>
                          <p>{trade.entry} | RR: {trade.riskReward}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTrade(trade.id)}
                          className="mt-2 text-red-400 hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                    {trades.length === 0 && (
                      <p className="text-gray-400 text-center py-8">No trades recorded yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            {analytics ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card 
                    className="bg-gray-900 border-gray-800 hover:border-blue-500 transition-all duration-300"
                    onMouseEnter={() => setHoveredElement('totalTrades')}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold" style={{ opacity: getOpacity('totalTrades') }}>
                        {analytics.totalTrades}
                      </div>
                      <p className="text-gray-400" style={{ opacity: getOpacity('totalTrades') }}>Total Trades</p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="bg-gray-900 border-gray-800 hover:border-green-500 transition-all duration-300"
                    onMouseEnter={() => setHoveredElement('winRate')}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold text-green-400" style={{ opacity: getOpacity('winRate') }}>
                        {analytics.winRate}%
                      </div>
                      <p className="text-gray-400" style={{ opacity: getOpacity('winRate') }}>Win Rate</p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="bg-gray-900 border-gray-800 hover:border-blue-500 transition-all duration-300"
                    onMouseEnter={() => setHoveredElement('avgRiskReward')}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold text-blue-400" style={{ opacity: getOpacity('avgRiskReward') }}>
                        {analytics.avgRiskReward}
                      </div>
                      <p className="text-gray-400" style={{ opacity: getOpacity('avgRiskReward') }}>Avg Risk/Reward</p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-all duration-300"
                    onMouseEnter={() => setHoveredElement('winsLosses')}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold" style={{ opacity: getOpacity('winsLosses') }}>
                        {analytics.wins}W/{analytics.losses}L
                      </div>
                      <p className="text-gray-400" style={{ opacity: getOpacity('winsLosses') }}>Wins/Losses</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>Monthly Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                            itemStyle={{ color: '#FFFFFF' }}
                          />
                          <Bar dataKey="wins" fill="#10B981" name="Wins" />
                          <Bar dataKey="losses" fill="#EF4444" name="Losses" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>Weekly Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analytics.weeklyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="week" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                            itemStyle={{ color: '#FFFFFF' }}
                          />
                          <Area type="monotone" dataKey="wins" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Wins" />
                          <Area type="monotone" dataKey="losses" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Losses" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>Win/Loss Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Wins', value: analytics.wins },
                              { name: 'Losses', value: analytics.losses }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell fill="#10B981" />
                            <Cell fill="#EF4444" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                            itemStyle={{ color: '#FFFFFF' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>Setup Performance Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-gray-300">Setup</TableHead>
                            <TableHead className="text-gray-300">Total</TableHead>
                            <TableHead className="text-gray-300">Wins</TableHead>
                            <TableHead className="text-gray-300">Win Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.setupStats.map((stat: any) => (
                            <TableRow key={stat.setup}>
                              <TableCell className="text-white">{stat.setup}</TableCell>
                              <TableCell className="text-white">{stat.total}</TableCell>
                              <TableCell className="text-white">{stat.wins}</TableCell>
                              <TableCell className="text-white">{stat.winRate}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Detailed Pair Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {analytics.detailedPairAnalysis.map((pairStat: any) => (
                        <div key={pairStat.pair} className="bg-gray-800 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{pairStat.pair}</h3>
                            <div className="text-sm text-gray-400">
                              {pairStat.total} trades • {pairStat.winRate}% win rate • Avg RR: {pairStat.avgRiskReward}
                            </div>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-gray-300">Setup</TableHead>
                                <TableHead className="text-gray-300">Total</TableHead>
                                <TableHead className="text-gray-300">Wins</TableHead>
                                <TableHead className="text-gray-300">Win Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pairStat.setupBreakdown.map((setup: any) => (
                                <TableRow key={setup.setup}>
                                  <TableCell className="text-white">{setup.setup}</TableCell>
                                  <TableCell className="text-white">{setup.total}</TableCell>
                                  <TableCell className="text-white">{setup.wins}</TableCell>
                                  <TableCell className="text-white">{setup.winRate}%</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Detailed Setup Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {analytics.detailedSetupAnalysis.map((setupStat: any) => (
                        <div key={setupStat.setup} className="bg-gray-800 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{setupStat.setup}</h3>
                            <div className="text-sm text-gray-400">
                              {setupStat.total} trades • {setupStat.winRate}% win rate • Avg RR: {setupStat.avgRiskReward}
                            </div>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-gray-300">Pair</TableHead>
                                <TableHead className="text-gray-300">Total</TableHead>
                                <TableHead className="text-gray-300">Wins</TableHead>
                                <TableHead className="text-gray-300">Win Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {setupStat.pairBreakdown.map((pair: any) => (
                                <TableRow key={pair.pair}>
                                  <TableCell className="text-white">{pair.pair}</TableCell>
                                  <TableCell className="text-white">{pair.total}</TableCell>
                                  <TableCell className="text-white">{pair.wins}</TableCell>
                                  <TableCell className="text-white">{pair.winRate}%</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-400">Add some trades to see analytics</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        

        <MadeWithDyad />
      </div>

      {/* Liquify Morphism SVG Filter */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="gooey" />
            <feBlend in="SourceGraphic" in2="gooey" mode="multiply" />
          </filter>
        </defs>
      </svg>

      <style>{`
        .liquify-morphism {
          filter: url(#gooey);
          animation: morph 8s ease-in-out infinite;
        }
        
        @keyframes morph {
          0%, 100% {
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          }
          25% {
            border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%;
          }
          50% {
            border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%;
          }
          75% {
            border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%;
          }
        }
        
        .screenshot-container {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .screenshot-container:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
};

export default Index;