/**
 * Comprehensive Dataset of 140+ Financial Instruments
 * Categories: Equity, Commodity, Sovereign Gold, Govt Bond, Futures, Options
 */

const instruments = [
  // --- INDICES & FUTURES ---
  { symbol: 'NIFTY-FUT', name: 'Nifty 50 Futures Sept', type: 'Futures', sector: 'Index', basePrice: 24500.00, volatility: 0.12 },
  { symbol: 'BANKNIFTY-FUT', name: 'Bank Nifty Futures Sept', type: 'Futures', sector: 'Index', basePrice: 51200.00, volatility: 0.15 },
  { symbol: 'FINNIFTY-FUT', name: 'Fin Nifty Futures Sept', type: 'Futures', sector: 'Index', basePrice: 22150.00, volatility: 0.14 },

  // --- OPTIONS ---
  { symbol: 'NIFTY-24800-CE', name: 'Nifty 24800 Call Option', type: 'Options', sector: 'Index', basePrice: 125.40, volatility: 0.85 },
  { symbol: 'NIFTY-24800-PE', name: 'Nifty 24800 Put Option', type: 'Options', sector: 'Index', basePrice: 98.70, volatility: 0.88 },
  { symbol: 'BANKNIFTY-51500-CE', name: 'Bank Nifty 51500 Call Option', type: 'Options', sector: 'Index', basePrice: 245.50, volatility: 0.90 },
  { symbol: 'BANKNIFTY-51500-PE', name: 'Bank Nifty 51500 Put Option', type: 'Options', sector: 'Index', basePrice: 210.80, volatility: 0.92 },

  // --- COMMODITIES & PRECIOUS METALS ---
  { symbol: 'MCX-GOLD', name: 'Gold 10g 999 Purity', type: 'Commodity', sector: 'Commodities', basePrice: 74850.00, volatility: 0.08 },
  { symbol: 'MCX-SILVER', name: 'Silver 1kg 999 Purity', type: 'Commodity', sector: 'Commodities', basePrice: 89400.00, volatility: 0.14 },
  { symbol: 'CRUDEOIL', name: 'Crude Oil 100 BBL', type: 'Commodity', sector: 'Commodities', basePrice: 6120.00, volatility: 0.22 },
  { symbol: 'NATURALGAS', name: 'Natural Gas 1250 mmBtu', type: 'Commodity', sector: 'Commodities', basePrice: 215.40, volatility: 0.28 },
  { symbol: 'COPPER', name: 'Copper 1 MT', type: 'Commodity', sector: 'Commodities', basePrice: 812.50, volatility: 0.16 },

  // --- SOVEREIGN GOLD BONDS ---
  { symbol: 'SGB-2028-IV', name: 'Sovereign Gold Bond 2028-IV', type: 'Sovereign Gold', sector: 'Commodities', basePrice: 7350.00, volatility: 0.05 },
  { symbol: 'SGB-2030-I', name: 'Sovereign Gold Bond 2030-I', type: 'Sovereign Gold', sector: 'Commodities', basePrice: 7420.00, volatility: 0.05 },

  // --- GOVERNMENT BONDS ---
  { symbol: 'GOI-7.18-2033', name: 'Govt of India 7.18% 2033 Bond', type: 'Govt Bond', sector: 'Bonds', basePrice: 101.40, volatility: 0.02 },
  { symbol: 'GOI-7.06-2028', name: 'Govt of India 7.06% 2028 Bond', type: 'Govt Bond', sector: 'Bonds', basePrice: 100.85, volatility: 0.02 },
  { symbol: 'US10Y-INR', name: 'US 10-Year Bond INR Yield', type: 'Govt Bond', sector: 'Bonds', basePrice: 99.20, volatility: 0.03 },

  // --- BANKING ---
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', type: 'Equity', sector: 'Banking', basePrice: 1650.00, volatility: 0.16 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', type: 'Equity', sector: 'Banking', basePrice: 1220.50, volatility: 0.17 },
  { symbol: 'SBIN', name: 'State Bank of India', type: 'Equity', sector: 'Banking', basePrice: 795.30, volatility: 0.19 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', type: 'Equity', sector: 'Banking', basePrice: 1785.40, volatility: 0.18 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', type: 'Equity', sector: 'Banking', basePrice: 1190.20, volatility: 0.20 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd.', type: 'Equity', sector: 'Banking', basePrice: 980.50, volatility: 0.24 },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd.', type: 'Equity', sector: 'Banking', basePrice: 185.20, volatility: 0.22 },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd.', type: 'Equity', sector: 'Banking', basePrice: 74.80, volatility: 0.25 },
  { symbol: 'PNB', name: 'Punjab National Bank', type: 'Equity', sector: 'Banking', basePrice: 108.40, volatility: 0.26 },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda', type: 'Equity', sector: 'Banking', basePrice: 248.60, volatility: 0.23 },
  { symbol: 'CANBK', name: 'Canara Bank', type: 'Equity', sector: 'Banking', basePrice: 104.30, volatility: 0.24 },
  { symbol: 'UNIONBANK', name: 'Union Bank of India', type: 'Equity', sector: 'Banking', basePrice: 121.75, volatility: 0.25 },

  // --- IT & TECH ---
  { symbol: 'TCS', name: 'Tata Consultancy Services', type: 'Equity', sector: 'IT', basePrice: 3820.00, volatility: 0.15 },
  { symbol: 'INFY', name: 'Infosys Ltd.', type: 'Equity', sector: 'IT', basePrice: 1590.20, volatility: 0.18 },
  { symbol: 'WIPRO', name: 'Wipro Ltd.', type: 'Equity', sector: 'IT', basePrice: 548.60, volatility: 0.20 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', type: 'Equity', sector: 'IT', basePrice: 1640.80, volatility: 0.17 },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', type: 'Equity', sector: 'IT', basePrice: 1310.00, volatility: 0.22 },
  { symbol: 'LTIM', name: 'LTIMindtree Ltd.', type: 'Equity', sector: 'IT', basePrice: 5240.00, volatility: 0.21 },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd.', type: 'Equity', sector: 'IT', basePrice: 5460.00, volatility: 0.24 },
  { symbol: 'COFORGE', name: 'Coforge Ltd.', type: 'Equity', sector: 'IT', basePrice: 6180.00, volatility: 0.25 },
  { symbol: 'LTTS', name: 'L&T Technology Services', type: 'Equity', sector: 'IT', basePrice: 5780.00, volatility: 0.22 },
  { symbol: 'OFSS', name: 'Oracle Financial Services', type: 'Equity', sector: 'IT', basePrice: 10120.00, volatility: 0.28 },
  { symbol: 'MPHASIS', name: 'Mphasis Ltd.', type: 'Equity', sector: 'IT', basePrice: 2840.00, volatility: 0.23 },
  { symbol: 'KPITTECH', name: 'KPIT Technologies Ltd.', type: 'Equity', sector: 'IT', basePrice: 1620.00, volatility: 0.27 },
  { symbol: 'TATAELXSI', name: 'Tata Elxsi Ltd.', type: 'Equity', sector: 'IT', basePrice: 6850.00, volatility: 0.26 },

  // --- FINANCIAL SERVICES & FINTECH ---
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', type: 'Equity', sector: 'Financial Services', basePrice: 7120.00, volatility: 0.21 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.', type: 'Equity', sector: 'Financial Services', basePrice: 1820.50, volatility: 0.20 },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Co.', type: 'Equity', sector: 'Financial Services', basePrice: 685.00, volatility: 0.18 },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Co.', type: 'Equity', sector: 'Financial Services', basePrice: 1540.00, volatility: 0.17 },
  { symbol: 'ICICIPRULI', name: 'ICICI Prudential Life Ins.', type: 'Equity', sector: 'Financial Services', basePrice: 595.00, volatility: 0.22 },
  { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment', type: 'Equity', sector: 'Financial Services', basePrice: 1410.00, volatility: 0.22 },
  { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance Ltd.', type: 'Equity', sector: 'Financial Services', basePrice: 1720.00, volatility: 0.20 },
  { symbol: 'MANAPPURAM', name: 'Manappuram Finance Ltd.', type: 'Equity', sector: 'Financial Services', basePrice: 198.50, volatility: 0.25 },
  { symbol: 'POONAWALLA', name: 'Poonawalla Fincorp Ltd.', type: 'Equity', sector: 'Financial Services', basePrice: 420.00, volatility: 0.24 },
  { symbol: 'CDSL', name: 'Central Depository Services', type: 'Equity', sector: 'Financial Services', basePrice: 1480.00, volatility: 0.28 },
  { symbol: 'BSE', name: 'BSE Limited', type: 'Equity', sector: 'Financial Services', basePrice: 2850.00, volatility: 0.30 },
  { symbol: 'MCX', name: 'Multi Commodity Exchange', type: 'Equity', sector: 'Financial Services', basePrice: 4250.00, volatility: 0.27 },
  { symbol: 'ANGELONE', name: 'Angel One Ltd.', type: 'Equity', sector: 'Financial Services', basePrice: 2680.00, volatility: 0.29 },

  // --- AUTOMOBILE ---
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', type: 'Equity', sector: 'Auto', basePrice: 965.00, volatility: 0.23 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', type: 'Equity', sector: 'Auto', basePrice: 12400.00, volatility: 0.16 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', type: 'Equity', sector: 'Auto', basePrice: 2780.00, volatility: 0.21 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', type: 'Equity', sector: 'Auto', basePrice: 9450.00, volatility: 0.18 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd.', type: 'Equity', sector: 'Auto', basePrice: 4890.00, volatility: 0.19 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd.', type: 'Equity', sector: 'Auto', basePrice: 5120.00, volatility: 0.18 },
  { symbol: 'TVSMOTOR', name: 'TVS Motor Company Ltd.', type: 'Equity', sector: 'Auto', basePrice: 2380.00, volatility: 0.22 },
  { symbol: 'BHARATFORG', name: 'Bharat Forge Ltd.', type: 'Equity', sector: 'Auto', basePrice: 1460.00, volatility: 0.23 },
  { symbol: 'MOTHERSON', name: 'Samvardhana Motherson Int.', type: 'Equity', sector: 'Auto', basePrice: 182.00, volatility: 0.24 },
  { symbol: 'BOSCHLTD', name: 'Bosch Ltd.', type: 'Equity', sector: 'Auto', basePrice: 32400.00, volatility: 0.15 },

  // --- ENERGY, OIL & GAS, POWER ---
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', type: 'Equity', sector: 'Energy', basePrice: 2985.00, volatility: 0.15 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp.', type: 'Equity', sector: 'Energy', basePrice: 305.50, volatility: 0.20 },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp.', type: 'Equity', sector: 'Energy', basePrice: 345.80, volatility: 0.22 },
  { symbol: 'IOC', name: 'Indian Oil Corporation', type: 'Equity', sector: 'Energy', basePrice: 168.20, volatility: 0.21 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd.', type: 'Equity', sector: 'Energy', basePrice: 485.60, volatility: 0.19 },
  { symbol: 'NTPC', name: 'NTPC Ltd.', type: 'Equity', sector: 'Power', basePrice: 412.00, volatility: 0.18 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp. of India', type: 'Equity', sector: 'Power', basePrice: 334.50, volatility: 0.16 },
  { symbol: 'TATAPOWER', name: 'Tata Power Company Ltd.', type: 'Equity', sector: 'Power', basePrice: 432.00, volatility: 0.24 },
  { symbol: 'ADANIGREEN', name: 'Adani Green Energy Ltd.', type: 'Equity', sector: 'Power', basePrice: 1780.00, volatility: 0.32 },
  { symbol: 'ADANIPOWER', name: 'Adani Power Ltd.', type: 'Equity', sector: 'Power', basePrice: 645.00, volatility: 0.34 },
  { symbol: 'NHPC', name: 'NHPC Ltd.', type: 'Equity', sector: 'Power', basePrice: 94.50, volatility: 0.24 },
  { symbol: 'SJVN', name: 'SJVN Ltd.', type: 'Equity', sector: 'Power', basePrice: 128.20, volatility: 0.26 },
  { symbol: 'SUZLON', name: 'Suzlon Energy Ltd.', type: 'Equity', sector: 'Power', basePrice: 78.40, volatility: 0.38 },
  { symbol: 'GAIL', name: 'GAIL (India) Ltd.', type: 'Equity', sector: 'Energy', basePrice: 226.00, volatility: 0.20 },
  { symbol: 'IGL', name: 'Indraprastha Gas Ltd.', type: 'Equity', sector: 'Energy', basePrice: 532.00, volatility: 0.19 },
  { symbol: 'MGL', name: 'Mahanagar Gas Ltd.', type: 'Equity', sector: 'Energy', basePrice: 1680.00, volatility: 0.21 },

  // --- FMCG & CONSUMER ---
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', type: 'Equity', sector: 'FMCG', basePrice: 2485.00, volatility: 0.14 },
  { symbol: 'ITC', name: 'ITC Ltd.', type: 'Equity', sector: 'FMCG', basePrice: 462.00, volatility: 0.13 },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd.', type: 'Equity', sector: 'FMCG', basePrice: 2540.00, volatility: 0.14 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd.', type: 'Equity', sector: 'FMCG', basePrice: 5040.00, volatility: 0.16 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products', type: 'Equity', sector: 'FMCG', basePrice: 1145.00, volatility: 0.18 },
  { symbol: 'DABUR', name: 'Dabur India Ltd.', type: 'Equity', sector: 'FMCG', basePrice: 545.00, volatility: 0.15 },
  { symbol: 'GODREJCP', name: 'Godrej Consumer Products', type: 'Equity', sector: 'FMCG', basePrice: 1180.00, volatility: 0.17 },
  { symbol: 'MARICO', name: 'Marico Ltd.', type: 'Equity', sector: 'FMCG', basePrice: 625.00, volatility: 0.16 },
  { symbol: 'COLPAL', name: 'Colgate-Palmolive India', type: 'Equity', sector: 'FMCG', basePrice: 2640.00, volatility: 0.15 },
  { symbol: 'VBL', name: 'Varun Beverages Ltd.', type: 'Equity', sector: 'FMCG', basePrice: 1480.00, volatility: 0.22 },
  { symbol: 'TITAN', name: 'Titan Company Ltd.', type: 'Equity', sector: 'Consumer', basePrice: 3450.00, volatility: 0.19 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', type: 'Equity', sector: 'Consumer', basePrice: 2880.00, volatility: 0.16 },
  { symbol: 'BERGEPAINT', name: 'Berger Paints India Ltd.', type: 'Equity', sector: 'Consumer', basePrice: 540.00, volatility: 0.18 },
  { symbol: 'HAVELS', name: 'Havells India Ltd.', type: 'Equity', sector: 'Consumer', basePrice: 1780.00, volatility: 0.19 },
  { symbol: 'VOLTAS', name: 'Voltas Ltd.', type: 'Equity', sector: 'Consumer', basePrice: 1320.00, volatility: 0.23 },
  { symbol: 'PAGEIND', name: 'Page Industries Ltd.', type: 'Equity', sector: 'Consumer', basePrice: 42100.00, volatility: 0.17 },

  // --- PHARMA & HEALTHCARE ---
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ind.', type: 'Equity', sector: 'Pharma', basePrice: 1680.00, volatility: 0.16 },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories", type: 'Equity', sector: 'Pharma', basePrice: 6480.00, volatility: 0.18 },
  { symbol: 'CIPLA', name: 'Cipla Ltd.', type: 'Equity', sector: 'Pharma', basePrice: 1540.00, volatility: 0.17 },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories Ltd.", type: 'Equity', sector: 'Pharma', basePrice: 4820.00, volatility: 0.20 },
  { symbol: 'LUPIN', name: 'Lupin Ltd.', type: 'Equity', sector: 'Pharma', basePrice: 1940.00, volatility: 0.22 },
  { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma Ltd.', type: 'Equity', sector: 'Pharma', basePrice: 1420.00, volatility: 0.23 },
  { symbol: 'ALKEM', name: 'Alkem Laboratories Ltd.', type: 'Equity', sector: 'Pharma', basePrice: 5380.00, volatility: 0.19 },
  { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals', type: 'Equity', sector: 'Pharma', basePrice: 3120.00, volatility: 0.18 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise', type: 'Equity', sector: 'Healthcare', basePrice: 6720.00, volatility: 0.19 },
  { symbol: 'MAXHEALTH', name: 'Max Healthcare Institute', type: 'Equity', sector: 'Healthcare', basePrice: 890.00, volatility: 0.23 },
  { symbol: 'FORTIS', name: 'Fortis Healthcare Ltd.', type: 'Equity', sector: 'Healthcare', basePrice: 465.00, volatility: 0.22 },

  // --- METALS & MINING ---
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', type: 'Equity', sector: 'Metals', basePrice: 152.00, volatility: 0.22 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', type: 'Equity', sector: 'Metals', basePrice: 940.00, volatility: 0.21 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd.', type: 'Equity', sector: 'Metals', basePrice: 670.00, volatility: 0.23 },
  { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power', type: 'Equity', sector: 'Metals', basePrice: 980.00, volatility: 0.25 },
  { symbol: 'VEDL', name: 'Vedanta Ltd.', type: 'Equity', sector: 'Metals', basePrice: 440.00, volatility: 0.28 },
  { symbol: 'NMDC', name: 'NMDC Ltd.', type: 'Equity', sector: 'Metals', basePrice: 220.00, volatility: 0.24 },
  { symbol: 'SAIL', name: 'Steel Authority of India', type: 'Equity', sector: 'Metals', basePrice: 132.00, volatility: 0.26 },

  // --- INFRA, CAPITAL GOODS & DEFENCE ---
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', type: 'Equity', sector: 'Infra', basePrice: 3580.00, volatility: 0.17 },
  { symbol: 'SIEMENS', name: 'Siemens Ltd.', type: 'Equity', sector: 'Capital Goods', basePrice: 6750.00, volatility: 0.24 },
  { symbol: 'ABB', name: 'ABB India Ltd.', type: 'Equity', sector: 'Capital Goods', basePrice: 7850.00, volatility: 0.25 },
  { symbol: 'BHEL', name: 'Bharat Heavy Electricals', type: 'Equity', sector: 'Capital Goods', basePrice: 275.00, volatility: 0.29 },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd.', type: 'Equity', sector: 'Capital Goods', basePrice: 295.00, volatility: 0.25 },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd.', type: 'Equity', sector: 'Capital Goods', basePrice: 4680.00, volatility: 0.27 },
  { symbol: 'MAZDOCK', name: 'Mazagon Dock Shipbuilders', type: 'Equity', sector: 'Capital Goods', basePrice: 4120.00, volatility: 0.32 },
  { symbol: 'COCHINSHIP', name: 'Cochin Shipyard Ltd.', type: 'Equity', sector: 'Capital Goods', basePrice: 1780.00, volatility: 0.33 },
  { symbol: 'POLYCAB', name: 'Polycab India Ltd.', type: 'Equity', sector: 'Capital Goods', basePrice: 6420.00, volatility: 0.23 },
  { symbol: 'CUMMINSIND', name: 'Cummins India Ltd.', type: 'Equity', sector: 'Capital Goods', basePrice: 3680.00, volatility: 0.22 },
  { symbol: 'RVNL', name: 'Rail Vikas Nigam Ltd.', type: 'Equity', sector: 'Infra', basePrice: 535.00, volatility: 0.34 },
  { symbol: 'IRFC', name: 'Indian Railway Finance Corp', type: 'Equity', sector: 'Infra', basePrice: 172.00, volatility: 0.30 },
  { symbol: 'IRCTC', name: 'IRCTC Ltd.', type: 'Equity', sector: 'Infra', basePrice: 890.00, volatility: 0.21 },

  // --- TELECOM & MEDIA ---
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', type: 'Equity', sector: 'Telecom', basePrice: 1540.00, volatility: 0.16 },
  { symbol: 'IDEA', name: 'Vodafone Idea Ltd.', type: 'Equity', sector: 'Telecom', basePrice: 10.45, volatility: 0.45 },
  { symbol: 'INDUSTOWER', name: 'Indus Towers Ltd.', type: 'Equity', sector: 'Telecom', basePrice: 415.00, volatility: 0.26 },
  { symbol: 'TATACOMM', name: 'Tata Communications Ltd.', type: 'Equity', sector: 'Telecom', basePrice: 1890.00, volatility: 0.22 },
  { symbol: 'ZEEL', name: 'Zee Entertainment Enterprises', type: 'Equity', sector: 'Media', basePrice: 135.00, volatility: 0.32 },
  { symbol: 'SUNTV', name: 'Sun TV Network Ltd.', type: 'Equity', sector: 'Media', basePrice: 785.00, volatility: 0.24 },
  { symbol: 'PVRINOX', name: 'PVR INOX Ltd.', type: 'Equity', sector: 'Media', basePrice: 1450.00, volatility: 0.23 },

  // --- REALTY ---
  { symbol: 'DLF', name: 'DLF Ltd.', type: 'Equity', sector: 'Realty', basePrice: 840.00, volatility: 0.23 },
  { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd.', type: 'Equity', sector: 'Realty', basePrice: 2850.00, volatility: 0.26 },
  { symbol: 'OBEROIRLTY', name: 'Oberoi Realty Ltd.', type: 'Equity', sector: 'Realty', basePrice: 1740.00, volatility: 0.24 },
  { symbol: 'PHOENIXLTD', name: 'The Phoenix Mills Ltd.', type: 'Equity', sector: 'Realty', basePrice: 1680.00, volatility: 0.22 },
  { symbol: 'PRESTIGE', name: 'Prestige Estates Projects', type: 'Equity', sector: 'Realty', basePrice: 1690.00, volatility: 0.27 },

  // --- CHEMICALS & FERTILIZERS ---
  { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd.', type: 'Equity', sector: 'Chemicals', basePrice: 3080.00, volatility: 0.17 },
  { symbol: 'SRF', name: 'SRF Ltd.', type: 'Equity', sector: 'Chemicals', basePrice: 2340.00, volatility: 0.21 },
  { symbol: 'PIIND', name: 'PI Industries Ltd.', type: 'Equity', sector: 'Chemicals', basePrice: 3950.00, volatility: 0.22 },
  { symbol: 'AARTIIND', name: 'Aarti Industries Ltd.', type: 'Equity', sector: 'Chemicals', basePrice: 585.00, volatility: 0.23 },
  { symbol: 'DEEPAKNTR', name: 'Deepak Nitrite Ltd.', type: 'Equity', sector: 'Chemicals', basePrice: 2750.00, volatility: 0.22 },
  { symbol: 'TATACHEM', name: 'Tata Chemicals Ltd.', type: 'Equity', sector: 'Chemicals', basePrice: 1040.00, volatility: 0.24 },
  { symbol: 'UPL', name: 'UPL Ltd.', type: 'Equity', sector: 'Chemicals', basePrice: 565.00, volatility: 0.25 },

  // --- RETAIL & NEW AGE INTERNET ---
  { symbol: 'ZOMATO', name: 'Zomato Ltd.', type: 'Equity', sector: 'Internet', basePrice: 260.00, volatility: 0.28 },
  { symbol: 'PAYTM', name: 'One97 Communications (Paytm)', type: 'Equity', sector: 'Internet', basePrice: 645.00, volatility: 0.35 },
  { symbol: 'NYKAA', name: 'FSN E-Commerce (Nykaa)', type: 'Equity', sector: 'Internet', basePrice: 198.00, volatility: 0.29 },
  { symbol: 'POLICYBZR', name: 'PB Fintech Ltd. (PolicyBazaar)', type: 'Equity', sector: 'Internet', basePrice: 1680.00, volatility: 0.28 },
  { symbol: 'DELHIVERY', name: 'Delhivery Ltd.', type: 'Equity', sector: 'Internet', basePrice: 410.00, volatility: 0.27 },
  { symbol: 'NAUKRI', name: 'Info Edge (India) Ltd.', type: 'Equity', sector: 'Internet', basePrice: 7420.00, volatility: 0.24 },
  { symbol: 'TRENT', name: 'Trent Ltd.', type: 'Equity', sector: 'Retail', basePrice: 6850.00, volatility: 0.26 },
  { symbol: 'DMART', name: 'Avenue Supermarts (DMart)', type: 'Equity', sector: 'Retail', basePrice: 4950.00, volatility: 0.19 },
  { symbol: 'JUBLFOOD', name: 'Jubilant FoodWorks Ltd.', type: 'Equity', sector: 'Retail', basePrice: 620.00, volatility: 0.22 },
  { symbol: 'DEVYANI', name: 'Devyani International Ltd.', type: 'Equity', sector: 'Retail', basePrice: 172.00, volatility: 0.23 }
];

module.exports = instruments;

