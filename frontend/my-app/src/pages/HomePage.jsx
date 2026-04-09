import React, { useEffect, useState, useRef } from 'react';
import {
  ChakraProvider, Box, Flex, Text, Button, Icon,
  HStack, VStack, Grid, extendTheme, IconButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Brain, TrendingUp, Users, Clock, CheckCircle, Shield,
  ChefHat, Bell, ArrowRight, Menu, X, BarChart3, Package,
  Utensils, Leaf, Target, MessageSquare, PieChart, ShoppingCart,
} from 'lucide-react';

// ─── THEME ────────────────────────────────────────────────────────────────────
// Fonts used:
//   Cormorant Garamond — high-contrast editorial serif (display headings)
//   Syne              — geometric grotesque with personality (body / UI)
//   DM Mono           — monospaced accents, labels, data
const theme = extendTheme({
  fonts: {
    heading: `'Cormorant Garamond', Georgia, serif`,
    body:    `'Syne', 'Helvetica Neue', sans-serif`,
  },
  styles: {
    global: {
      'html, body': {
        bg: '#F7F4EE', color: '#141210',
        margin: 0, padding: 0,
        fontFamily: `'Syne', sans-serif`,
        overflowX: 'hidden',
      },
      '::selection': { bg: '#E8C97A', color: '#141210' },
      '*': { boxSizing: 'border-box' },
    },
  },
});

const MB = motion(Box);
const MF = motion(Flex);

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  cream:  '#F7F4EE',
  ink:    '#141210',
  gold:   '#B8832A',
  goldL:  '#E8C97A',
  muted:  '#8A8275',
  border: '#E2DDD4',
  surf:   '#EFEBE3',
  white:  '#FFFFFF',
};

// ─── ANIMATION ───────────────────────────────────────────────────────────────
const ease    = [0.22, 1, 0.36, 1];
const fadeUp  = { hidden: { opacity: 0, y: 28 },  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } };
const fadeL   = { hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0, transition: { duration: 0.65, ease } } };
const fadeR   = { hidden: { opacity: 0, x: 24 },  show: { opacity: 1, x: 0, transition: { duration: 0.65, ease } } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const end = parseInt(to);
    const step = Math.ceil(end / (1800 / 16));
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, end);
      setN(cur);
      if (cur >= end) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [inView, to]);
  return <span ref={ref}>{n}{suffix}</span>;
}

// ─── MONO LABEL ──────────────────────────────────────────────────────────────
function MonoLabel({ children, light = false }) {
  return (
    <Flex align="center" gap="10px" mb="20px">
      <Box w="28px" h="1px" bg={light ? 'rgba(255,255,255,0.28)' : C.gold} flexShrink={0} />
      <Text
        fontFamily="'DM Mono', monospace"
        fontSize="10px" fontWeight="300" letterSpacing="0.16em"
        textTransform="uppercase"
        color={light ? 'rgba(255,255,255,0.4)' : C.gold}
      >{children}</Text>
    </Flex>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ navigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const go = id => { document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false); };
  const links = [
    { label: 'Features', href: '#features' },
    { label: 'Process',  href: '#process'  },
    { label: 'Reviews',  href: '#reviews'  },
    { label: 'Pricing',  href: '#pricing'  },
  ];
  return (
    <Box
      as="nav" position="fixed" top={0} left={0} right={0} zIndex={200}
      bg={scrolled ? 'rgba(247,244,238,0.94)' : 'transparent'}
      backdropFilter={scrolled ? 'blur(18px)' : 'none'}
      borderBottom={scrolled ? `1px solid ${C.border}` : '1px solid transparent'}
      transition="all 0.35s ease"
    >
      <Flex align="center" justify="space-between" px={{ base: '20px', md: '48px' }} h="64px">
        <Flex align="center" gap="10px" cursor="pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Box w="32px" h="32px" bg={C.ink} display="flex" alignItems="center" justifyContent="center">
            <Icon as={ChefHat} boxSize="15px" color={C.gold} />
          </Box>
          <Text fontFamily="'Cormorant Garamond', serif" fontSize="20px" fontWeight="500" letterSpacing="-0.02em">
            Resto<Text as="span" color={C.gold} fontStyle="italic">AI</Text>
          </Text>
        </Flex>
        <HStack gap="36px" display={{ base: 'none', md: 'flex' }}>
          {links.map(l => (
            <Text
              key={l.href} fontSize="11px" fontWeight="500" letterSpacing="0.06em"
              textTransform="uppercase" color={C.muted} cursor="pointer"
              onClick={() => go(l.href)}
              _hover={{ color: C.ink, transition: 'color 0.2s' }}
            >{l.label}</Text>
          ))}
        </HStack>
        <HStack gap="10px" display={{ base: 'none', md: 'flex' }}>
          <Button
            onClick={() => navigate('/login')}
            bg="transparent" color={C.muted} border={`1px solid ${C.border}`}
            fontSize="10px" fontWeight="600" letterSpacing="0.08em" textTransform="uppercase"
            h="36px" px="18px" borderRadius="0"
            _hover={{ bg: C.surf, color: C.ink }}
          >Sign In</Button>
          <Button
            onClick={() => navigate('/register')}
            bg={C.ink} color={C.cream}
            fontSize="10px" fontWeight="600" letterSpacing="0.08em" textTransform="uppercase"
            h="36px" px="18px" borderRadius="0"
            _hover={{ bg: C.gold }}
          >Get Started</Button>
        </HStack>
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          icon={<Icon as={open ? X : Menu} boxSize="18px" />}
          variant="ghost" aria-label="Menu" size="sm"
          onClick={() => setOpen(p => !p)}
        />
      </Flex>
      <AnimatePresence>
        {open && (
          <MB
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} overflow="hidden"
            bg={C.cream} borderTop={`1px solid ${C.border}`}
          >
            <VStack align="stretch" px="20px" py="16px" gap="0">
              {links.map(l => (
                <Text
                  key={l.href} py="12px" fontSize="14px" color={C.muted} cursor="pointer"
                  borderBottom={`1px solid ${C.border}`}
                  onClick={() => go(l.href)} _hover={{ color: C.ink }}
                >{l.label}</Text>
              ))}
              <HStack gap="10px" pt="16px">
                <Button flex="1" bg="transparent" border={`1px solid ${C.border}`} borderRadius="0" fontSize="12px" onClick={() => navigate('/login')}>Sign In</Button>
                <Button flex="1" bg={C.ink} color={C.cream} borderRadius="0" fontSize="12px" onClick={() => navigate('/register')}>Get Started</Button>
              </HStack>
            </VStack>
          </MB>
        )}
      </AnimatePresence>
    </Box>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero({ navigate }) {
  const scrollTo = id => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <Box
      as="section" minH="100vh" bg={C.ink} position="relative" overflow="hidden"
      display="grid" gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }}
    >
      {/* Grid texture */}
      <Box
        position="absolute" inset="0" pointerEvents="none" opacity="0.035"
        style={{
          backgroundImage: 'linear-gradient(rgba(232,201,122,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(232,201,122,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Radial warm glow */}
      <Box
        position="absolute" top="-15%" left="40%" w="700px" h="700px" borderRadius="full"
        style={{ background: 'radial-gradient(circle, rgba(184,131,42,0.14) 0%, transparent 65%)' }}
        pointerEvents="none"
      />

      {/* LEFT */}
      <MB
        variants={stagger} initial="hidden" animate="show"
        display="flex" flexDirection="column" justifyContent="flex-end"
        px={{ base: '24px', md: '64px' }}
        pt={{ base: '120px', md: '160px' }}
        pb={{ base: '64px', md: '80px' }}
        borderRight={{ lg: '1px solid rgba(255,255,255,0.06)' }}
        position="relative" zIndex={1}
      >
        <MB variants={fadeUp} mb="0">
          <MonoLabel light>AI Restaurant Intelligence — 2026</MonoLabel>
        </MB>
        <MB variants={fadeUp} mb="28px">
          <Text
            fontFamily="'Cormorant Garamond', serif"
            fontSize={{ base: '58px', md: '82px', lg: '96px' }}
            fontWeight="300" lineHeight="0.92" letterSpacing="-0.03em"
            color={C.white}
          >
            The kitchen<br />runs on{' '}
            <Text as="em" color={C.gold} fontStyle="italic">data,</Text>
            <br />not instinct.
          </Text>
        </MB>
        <MB variants={fadeUp} mb="40px">
          <Text
            fontSize={{ base: '14px', md: '15px' }} color="rgba(255,255,255,0.48)"
            maxW="400px" lineHeight="1.85" fontWeight="400"
          >
            Demand forecasting, waste reduction, and margin optimization — unified in one platform for operators who think in numbers.
          </Text>
        </MB>
        <MB variants={fadeUp} mb="56px">
          <HStack gap="12px" flexWrap="wrap">
            <Button
              bg={C.gold} color={C.white} borderRadius="0"
              fontSize="10px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase"
              h="48px" px="28px"
              _hover={{ bg: C.white, color: C.ink }}
              onClick={() => navigate('/register')}
            >
              Start Free Trial <Icon as={ArrowRight} boxSize="13px" ml="8px" />
            </Button>
            <Button
              bg="transparent" color="rgba(255,255,255,0.55)"
              border="1px solid rgba(255,255,255,0.16)" borderRadius="0"
              fontSize="10px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase"
              h="48px" px="28px"
              _hover={{ color: C.white, borderColor: 'rgba(255,255,255,0.38)' }}
              onClick={() => scrollTo('#features')}
            >
              See How It Works
            </Button>
          </HStack>
          <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.07em" color="rgba(255,255,255,0.2)" mt="14px">
            No credit card · 14-day free trial · Cancel anytime
          </Text>
        </MB>
        {/* Stats */}
        <MB variants={fadeUp}>
          <Flex gap="0" pt="28px" borderTop="1px solid rgba(255,255,255,0.07)">
            {[
              { val: '40', suffix: '%', label: 'Less Waste' },
              { val: '25', suffix: '%', label: 'More Profit' },
              { val: '98', suffix: '%', label: 'Accuracy' },
            ].map(({ val, suffix, label }, i) => (
              <Box
                key={label} flex="1"
                pl={i === 0 ? '0' : '24px'} pr={i === 2 ? '0' : '24px'}
                borderRight={i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none'}
              >
                <Text fontFamily="'Cormorant Garamond', serif" fontSize="38px" fontWeight="300" color={C.white} lineHeight="1">
                  <Counter to={val} suffix={suffix} />
                </Text>
                <Text fontFamily="'DM Mono', monospace" fontSize="8px" letterSpacing="0.12em" textTransform="uppercase" color="rgba(255,255,255,0.28)" mt="6px">{label}</Text>
              </Box>
            ))}
          </Flex>
        </MB>
      </MB>

      {/* RIGHT — Dashboard mockup */}
      <MB
        initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease }}
        display={{ base: 'none', lg: 'flex' }}
        alignItems="flex-end" px="48px" pb="80px" pt="120px"
        position="relative" zIndex={1}
      >
        <Box w="100%" maxW="440px" mx="auto" position="relative">
          {/* Chip — revenue */}
          <MB
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease }}
            position="absolute" top="-20px" right="0" zIndex={3}
          >
            <Box bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)" px="14px" py="10px" display="flex" alignItems="center" gap="10px">
              <Box w="5px" h="5px" borderRadius="full" bg="#4CAF6A" />
              <Box>
                <Text fontFamily="'Cormorant Garamond', serif" fontSize="18px" fontWeight="300" color="#4CAF6A" lineHeight="1">₹48,320</Text>
                <Text fontFamily="'DM Mono', monospace" fontSize="8px" letterSpacing="0.1em" color="rgba(255,255,255,0.28)" textTransform="uppercase">Revenue today</Text>
              </Box>
            </Box>
          </MB>
          {/* Chip — waste */}
          <MB
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease }}
            position="absolute" bottom="100px" left="-40px" zIndex={3}
          >
            <Box bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)" px="14px" py="10px" display="flex" alignItems="center" gap="10px">
              <Box w="5px" h="5px" borderRadius="full" bg={C.gold} />
              <Box>
                <Text fontFamily="'Cormorant Garamond', serif" fontSize="18px" fontWeight="300" color={C.goldL} lineHeight="1">−42%</Text>
                <Text fontFamily="'DM Mono', monospace" fontSize="8px" letterSpacing="0.1em" color="rgba(255,255,255,0.28)" textTransform="uppercase">Waste saved</Text>
              </Box>
            </Box>
          </MB>
          {/* Dashboard */}
          <Box bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)">
            {/* Topbar */}
            <Flex align="center" justify="space-between" px="18px" py="12px" borderBottom="1px solid rgba(255,255,255,0.06)">
              <Flex gap="5px">
                {['#C0392B','#E07B39','#3D9970'].map(c => <Box key={c} w="7px" h="7px" borderRadius="full" bg={c} />)}
              </Flex>
              <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" color="rgba(255,255,255,0.22)" textTransform="uppercase">RestoAI · Live</Text>
              <Box w="40px" />
            </Flex>
            {/* KPIs */}
            <Grid templateColumns="repeat(3,1fr)">
              {[
                { label: 'Revenue', val: '₹48.3K', delta: '↑ 18.4%', pos: true },
                { label: 'Orders',  val: '142',     delta: '↑ 9 today', pos: true },
                { label: 'Waste',   val: '−42%',    delta: 'Target met', pos: false },
              ].map(({ label, val, delta, pos }, i) => (
                <Box key={label} px="14px" py="14px" borderRight={i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none'}>
                  <Text fontFamily="'DM Mono', monospace" fontSize="8px" letterSpacing="0.1em" textTransform="uppercase" color="rgba(255,255,255,0.25)" mb="6px">{label}</Text>
                  <Text fontFamily="'Cormorant Garamond', serif" fontSize="22px" fontWeight="300" color={C.white} lineHeight="1">{val}</Text>
                  <Text fontSize="9px" color={pos ? '#4CAF6A' : C.gold} mt="4px" fontWeight="500">{delta}</Text>
                </Box>
              ))}
            </Grid>
            {/* Mini chart */}
            <Box px="14px" py="14px" borderTop="1px solid rgba(255,255,255,0.06)">
              <Text fontFamily="'DM Mono', monospace" fontSize="8px" letterSpacing="0.1em" textTransform="uppercase" color="rgba(255,255,255,0.25)" mb="12px">Weekly Revenue</Text>
              <Flex align="flex-end" gap="4px" h="56px">
                {[52,68,58,82,71,95,77].map((h, i) => (
                  <Box key={i} flex="1" bg={h === 95 ? C.white : h === 82 ? C.gold : 'rgba(255,255,255,0.1)'} style={{ height: `${h}%` }} />
                ))}
              </Flex>
              <Flex justify="space-between" mt="6px">
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <Text key={i} fontFamily="'DM Mono', monospace" fontSize="8px" color="rgba(255,255,255,0.18)" flex="1" textAlign="center">{d}</Text>
                ))}
              </Flex>
            </Box>
            {/* Alert */}
            <Box px="14px" py="10px" borderTop="1px solid rgba(184,131,42,0.18)" bg="rgba(184,131,42,0.07)" display="flex" alignItems="center" gap="8px">
              <Box w="5px" h="5px" borderRadius="full" bg={C.gold} flexShrink={0} />
              <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.05em" color="rgba(232,201,122,0.7)">
                Low stock: Chicken breast — reorder in 2 days
              </Text>
            </Box>
          </Box>
        </Box>
      </MB>
    </Box>
  );
}

// ─── MARQUEE ─────────────────────────────────────────────────────────────────
function Marquee() {
  const names = ['Spice Route Mumbai','Urban Kitchen Delhi','FoodChain India','The Amber Table','Curry Leaf Goa','Oven Story','Bombay Brasserie','The Fatty Bao'];
  const doubled = [...names, ...names];
  return (
    <Box bg={C.white} borderTop={`1px solid ${C.border}`} borderBottom={`1px solid ${C.border}`} overflow="hidden" py="14px">
      <Flex
        whiteSpace="nowrap"
        sx={{
          animation: 'marquee 26s linear infinite',
          '@keyframes marquee': {
            '0%':   { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
        }}
      >
        {doubled.map((name, i) => (
          <Text
            key={i} flexShrink={0}
            fontFamily="'Cormorant Garamond', serif"
            fontSize="15px" fontStyle="italic" fontWeight="400"
            color={C.muted} px="28px" borderRight={`1px solid ${C.border}`}
          >{name}</Text>
        ))}
      </Flex>
    </Box>
  );
}

// ─── ABOUT ───────────────────────────────────────────────────────────────────
function About() {
  const features = [
    { n: '01', title: 'AI Demand Forecasting', desc: 'Trained on weather, events, and 24 months of your history. Accurate to within 2%.' },
    { n: '02', title: 'Smart Inventory',        desc: 'Auto-tracks stock, flags expiry risks, and generates purchase orders before you run out.' },
    { n: '03', title: 'Menu Intelligence',      desc: 'Know which dishes build margin and which quietly drain your kitchen resources.' },
  ];
  return (
    <Box as="section" display="grid" gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }} borderBottom={`1px solid ${C.border}`}>
      <MB
        variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
        px={{ base: '24px', md: '64px' }} py={{ base: '64px', md: '96px' }}
        borderRight={{ lg: `1px solid ${C.border}` }}
      >
        <MB variants={fadeL}><MonoLabel>01 — Why RestoAI</MonoLabel></MB>
        <MB variants={fadeL}>
          <Text fontFamily="'Cormorant Garamond', serif" fontSize={{ base: '48px', md: '72px' }} fontWeight="300" lineHeight="0.95" letterSpacing="-0.025em" color={C.ink}>
            Most kitchens<br />run on{' '}
            <Text as="em" color={C.gold} fontStyle="italic">gut feel.</Text>
            <br />Yours won't.
          </Text>
        </MB>
      </MB>
      <MB
        variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
        px={{ base: '24px', md: '64px' }} py={{ base: '64px', md: '96px' }}
        display="flex" flexDirection="column" justifyContent="center"
      >
        <MB variants={fadeR} mb="32px">
          <Text fontSize="14px" lineHeight="1.85" color={C.muted} maxW="420px">
            Restaurant margins are brutally thin. The difference between profit and loss often comes down to one bad week of over-ordering or one unexpected spike in demand. RestoAI gives you the operational intelligence to see what's coming.
          </Text>
        </MB>
        <VStack align="stretch" gap="0">
          {features.map(({ n, title, desc }) => (
            <MB
              key={n} variants={fadeR}
              display="flex" alignItems="flex-start" gap="16px"
              borderTop={`1px solid ${C.border}`} py="20px"
              _last={{ borderBottom: `1px solid ${C.border}` }}
            >
              <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.12em" color={C.gold} mt="3px" flexShrink={0}>{n}</Text>
              <Box>
                <Text fontSize="13px" fontWeight="600" letterSpacing="0.02em" color={C.ink} mb="4px">{title}</Text>
                <Text fontSize="12px" lineHeight="1.75" color={C.muted}>{desc}</Text>
              </Box>
            </MB>
          ))}
        </VStack>
      </MB>
    </Box>
  );
}

// ─── FEATURES ────────────────────────────────────────────────────────────────
function Features() {
  const items = [
    { icon: Bell,          title: 'Proactive Alerts',   desc: 'Know before problems happen — low stock, spoilage risk, staffing gaps.' },
    { icon: Package,       title: 'Smart Inventory',    desc: 'Automated tracking eliminates over-ordering and flags expiry risks.' },
    { icon: Users,         title: 'Staff Scheduling',   desc: 'Optimal shifts based on predicted footfall. Never over- or understaffed.' },
    { icon: MessageSquare, title: 'Voice Input',        desc: 'Kitchen staff speaks, system listens. No typing during busy service.' },
    { icon: Brain,         title: 'Demand Forecasting', desc: 'Our models predict exactly how much you\'ll need — accurate to 98%, driven by weather, local events, and 24 months of pattern learning.' },
    { icon: BarChart3,     title: 'Revenue Analytics',  desc: 'Deep visibility across every menu item, table, and shift.' },
    { icon: PieChart,      title: 'Waste Reduction',    desc: 'Precision reporting shows exactly where losses happen.' },
    { icon: Utensils,      title: 'Menu Intelligence',  desc: 'Understand which dishes drive margin and which drain resources.' },
  ];
  return (
    <Box as="section" id="features" borderBottom={`1px solid ${C.border}`}>
      {/* Header */}
      <MB
        initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
        px={{ base: '24px', md: '64px' }} pt={{ base: '64px', md: '96px' }} pb="48px"
        display="flex" alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" gap="24px"
        borderBottom={`1px solid ${C.border}`}
      >
        <Box>
          <MB variants={fadeL}><MonoLabel>02 — Features</MonoLabel></MB>
          <MB variants={fadeL}>
            <Text fontFamily="'Cormorant Garamond', serif" fontSize={{ base: '44px', md: '64px' }} fontWeight="300" lineHeight="0.95" letterSpacing="-0.025em" color={C.ink}>
              Every tool<br />in one place.
            </Text>
          </MB>
        </Box>
        <MB variants={fadeR}>
          <Text fontSize="14px" color={C.muted} lineHeight="1.8" maxW="280px">
            Built by restaurateurs — not generic SaaS with a chef's hat on.
          </Text>
        </MB>
      </MB>
      {/* Asymmetric cell grid */}
      <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }}>
        {items.map((item, i) => {
          const isHero = i === 4; // spans 2 cols on large screens
          return (
            <MB
              key={i} variants={fadeUp}
              initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}
              gridColumn={isHero ? { base: '1', sm: 'span 2' } : 'auto'}
              bg={isHero ? C.ink : C.cream}
              p={{ base: '28px 24px', md: '36px 32px' }}
              borderRight={`1px solid ${isHero ? 'rgba(255,255,255,0.06)' : C.border}`}
              borderBottom={`1px solid ${isHero ? 'rgba(255,255,255,0.06)' : C.border}`}
              position="relative" cursor="default"
              _hover={{ bg: isHero ? '#1e1b16' : C.white, transition: 'background 0.25s' }}
              sx={{ '&:nth-of-type(4n)': { borderRightColor: 'transparent' } }}
            >
              <Box
                w="34px" h="34px"
                border={`1px solid ${isHero ? 'rgba(255,255,255,0.1)' : C.border}`}
                display="flex" alignItems="center" justifyContent="center" mb="22px"
              >
                <Icon as={item.icon} boxSize="14px" color={isHero ? C.goldL : C.gold} />
              </Box>
              <Text fontSize="13px" fontWeight="600" letterSpacing="0.02em" color={isHero ? C.white : C.ink} mb="8px">{item.title}</Text>
              <Text fontSize="12px" lineHeight="1.72" color={isHero ? 'rgba(255,255,255,0.45)' : C.muted} maxW={isHero ? '340px' : 'none'}>{item.desc}</Text>
              <Text
                position="absolute" bottom="14px" right="16px"
                fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em"
                color={isHero ? 'rgba(255,255,255,0.08)' : C.border}
              >{String(i + 1).padStart(2, '0')}</Text>
            </MB>
          );
        })}
      </Grid>
    </Box>
  );
}

// ─── PROCESS ─────────────────────────────────────────────────────────────────
function Process() {
  const steps = [
    { n: '01', icon: ShoppingCart, title: 'Connect Inventory', desc: 'Link your existing system or set up from scratch in under 10 minutes.' },
    { n: '02', icon: Target,       title: 'Set Your Targets',  desc: 'Define waste limits, safety stock, and revenue goals for your operation.' },
    { n: '03', icon: Brain,        title: 'AI Gets to Work',   desc: 'Models process your data and generate actionable daily forecasts.' },
    { n: '04', icon: CheckCircle,  title: 'Make Better Calls', desc: 'Act on precise recommendations. Less guesswork. More profit.' },
  ];
  return (
    <Box as="section" id="process" px={{ base: '24px', md: '64px' }} py={{ base: '64px', md: '96px' }} borderBottom={`1px solid ${C.border}`}>
      <MB initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
        <MB variants={fadeUp} mb="0"><MonoLabel>03 — Process</MonoLabel></MB>
        <MB variants={fadeUp} mb="56px">
          <Text fontFamily="'Cormorant Garamond', serif" fontSize={{ base: '44px', md: '64px' }} fontWeight="300" lineHeight="0.95" letterSpacing="-0.025em" color={C.ink}>
            Running in<br />four steps.
          </Text>
        </MB>
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }} gap="0">
          {steps.map(({ n, icon, title, desc }, i) => (
            <MB
              key={n} variants={fadeUp}
              pr={{ lg: i < 3 ? '32px' : '0' }} pl={{ lg: i > 0 ? '32px' : '0' }}
              py={{ base: '24px', lg: '0' }}
              borderRight={{ lg: i < 3 ? `1px solid ${C.border}` : 'none' }}
              borderBottom={{ base: i < 3 ? `1px solid ${C.border}` : 'none', lg: 'none' }}
            >
              <Flex align="center" mb="24px" gap="0">
                <Box w="8px" h="8px" bg={C.gold} flexShrink={0} />
                <Box flex="1" h="1px" bg={C.border} />
              </Flex>
              <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.14em" textTransform="uppercase" color={C.gold} mb="12px">Step {n}</Text>
              <Text fontFamily="'Cormorant Garamond', serif" fontSize="22px" fontWeight="400" letterSpacing="-0.01em" color={C.ink} mb="10px">{title}</Text>
              <Text fontSize="12px" lineHeight="1.75" color={C.muted}>{desc}</Text>
            </MB>
          ))}
        </Grid>
      </MB>
    </Box>
  );
}

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────
function Testimonials() {
  const quotes = [
    { q: 'RestoAI cut our food waste by 42% in the first month alone. The ROI was immediate and the dashboard is genuinely a pleasure to use every day.', name: 'Rajesh Chopra', role: 'Owner, Spice Route Mumbai' },
    { q: 'Voice input transformed how our kitchen team works. No more scribbled notes during service — we speak and it tracks everything perfectly.', name: 'Shweta Patel', role: 'Head Chef, Urban Kitchen Delhi' },
    { q: "Managing 5 restaurants used to mean 5 dashboards. Now it's one. The multi-location visibility alone is worth the subscription price.", name: 'Amit Kumar', role: 'CEO, FoodChain India' },
  ];
  return (
    <Box as="section" id="reviews" bg={C.ink}>
      <MB
        initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
        px={{ base: '24px', md: '64px' }} pt={{ base: '64px', md: '96px' }} pb="56px"
        display="flex" alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" gap="24px"
      >
        <Box>
          <MB variants={fadeL}><MonoLabel light>04 — Reviews</MonoLabel></MB>
          <MB variants={fadeL}>
            <Text fontFamily="'Cormorant Garamond', serif" fontSize={{ base: '48px', md: '72px' }} fontWeight="300" lineHeight="0.95" letterSpacing="-0.025em" color={C.white}>
              What operators<br /><Text as="em" color={C.gold} fontStyle="italic">actually</Text> say.
            </Text>
          </MB>
        </Box>
      </MB>
      <MB
        initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
        display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(3,1fr)' }}
        borderTop="1px solid rgba(255,255,255,0.06)"
      >
        {quotes.map(({ q, name, role }, i) => (
          <MB
            key={i} variants={fadeUp}
            px={{ base: '24px', md: '40px' }} py="48px"
            borderRight={{ md: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
          >
            <Flex gap="3px" mb="24px">
              {[...Array(5)].map((_, si) => (
                <Box key={si} w="9px" h="9px" bg={C.gold} flexShrink={0}
                  style={{ clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }}
                />
              ))}
            </Flex>
            <Text fontFamily="'Cormorant Garamond', serif" fontSize="19px" fontWeight="300" fontStyle="italic" lineHeight="1.65" color="rgba(255,255,255,0.82)" mb="28px">"{q}"</Text>
            <Box borderTop="1px solid rgba(255,255,255,0.07)" pt="20px">
              <Flex align="center" gap="12px">
                <Box
                  w="36px" h="36px" bg="rgba(184,131,42,0.15)"
                  display="flex" alignItems="center" justifyContent="center"
                  fontFamily="'Cormorant Garamond', serif" fontSize="14px" color={C.gold} fontWeight="500" flexShrink={0}
                >
                  {name.split(' ').map(w => w[0]).join('')}
                </Box>
                <Box>
                  <Text fontSize="12px" fontWeight="600" letterSpacing="0.03em" color={C.white}>{name}</Text>
                  <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.07em" color="rgba(255,255,255,0.26)" mt="2px">{role}</Text>
                </Box>
              </Flex>
            </Box>
          </MB>
        ))}
      </MB>
    </Box>
  );
}

// ─── PRICING ─────────────────────────────────────────────────────────────────
function Pricing({ navigate }) {
  const plans = [
    {
      name: 'Starter', price: '0', period: 'Free forever',
      desc: 'For single-location restaurants getting started.',
      features: ['Basic inventory tracking','Weekly email reports','Up to 3 staff accounts','Community support'],
      cta: 'Start Free', featured: false, action: () => navigate('/register'),
    },
    {
      name: 'Professional', price: '49', period: 'per month',
      desc: 'For growing restaurants that take operations seriously.',
      features: ['AI demand forecasting','Voice input for kitchen','Multi-location support','Priority support','Advanced analytics','Menu intelligence'],
      cta: 'Start Free Trial', featured: true, action: () => navigate('/register'),
    },
    {
      name: 'Enterprise', price: '199', period: 'per month',
      desc: 'For chains and groups needing custom solutions.',
      features: ['Everything in Professional','Custom API integrations','Dedicated account manager','On-premise deployment','SLA guarantee'],
      cta: 'Talk to Sales', featured: false, action: () => navigate('/contact'),
    },
  ];
  return (
    <Box as="section" id="pricing" borderBottom={`1px solid ${C.border}`}>
      <MB
        initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
        px={{ base: '24px', md: '64px' }} pt={{ base: '64px', md: '96px' }} pb="48px"
        display="flex" alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" gap="24px"
        borderBottom={`1px solid ${C.border}`}
      >
        <Box>
          <MB variants={fadeL}><MonoLabel>05 — Pricing</MonoLabel></MB>
          <MB variants={fadeL}>
            <Text fontFamily="'Cormorant Garamond', serif" fontSize={{ base: '44px', md: '64px' }} fontWeight="300" lineHeight="0.95" letterSpacing="-0.025em" color={C.ink}>
              Plans for every<br />size of operation.
            </Text>
          </MB>
        </Box>
        <MB variants={fadeR}>
          <Text fontSize="14px" color={C.muted} lineHeight="1.8">Start free and scale as your restaurant grows.</Text>
        </MB>
      </MB>
      <MB
        initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
        display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(3,1fr)' }}
      >
        {plans.map(({ name, price, period, desc, features, cta, featured, action }, i) => (
          <MB
            key={name} variants={fadeUp}
            bg={featured ? C.gold : C.cream}
            px={{ base: '24px', md: '40px' }} py="48px"
            borderRight={{ md: i < 2 ? `1px solid ${featured ? 'rgba(255,255,255,0.15)' : C.border}` : 'none' }}
            display="flex" flexDirection="column" position="relative"
          >
            {featured && (
              <Text
                position="absolute" top="20px" right="20px"
                fontFamily="'DM Mono', monospace" fontSize="8px"
                letterSpacing="0.12em" textTransform="uppercase"
                color="rgba(255,255,255,0.55)"
              >Most Popular</Text>
            )}
            <Text fontFamily="'Cormorant Garamond', serif" fontSize="28px" fontWeight="400" letterSpacing="-0.01em" color={featured ? C.white : C.ink} mb="6px">{name}</Text>
            <Text fontSize="12px" color={featured ? 'rgba(255,255,255,0.65)' : C.muted} mb="28px" lineHeight="1.6">{desc}</Text>
            <Text fontFamily="'Cormorant Garamond', serif" fontSize="56px" fontWeight="300" letterSpacing="-0.03em" lineHeight="1" color={featured ? C.white : C.ink}>${price}</Text>
            <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" textTransform="uppercase" color={featured ? 'rgba(255,255,255,0.5)' : C.muted} mb="28px" mt="4px">{period}</Text>
            <VStack align="stretch" gap="0" flex="1" mb="28px">
              {features.map((f, fi) => (
                <Flex key={fi} align="flex-start" gap="12px" py="12px" borderBottom={`1px solid ${featured ? 'rgba(255,255,255,0.12)' : C.border}`}>
                  <Box w="14px" h="14px" bg={featured ? 'rgba(255,255,255,0.18)' : 'rgba(184,131,42,0.15)'} display="flex" alignItems="center" justifyContent="center" flexShrink={0} mt="1px">
                    <Icon as={CheckCircle} boxSize="8px" color={featured ? C.white : C.gold} />
                  </Box>
                  <Text fontSize="12px" color={featured ? 'rgba(255,255,255,0.8)' : C.ink} lineHeight="1.5">{f}</Text>
                </Flex>
              ))}
            </VStack>
            <Button
              onClick={action} borderRadius="0"
              bg={featured ? C.ink : C.ink} color={C.cream}
              fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase"
              h="44px" w="100%"
              _hover={{ bg: featured ? C.white : C.ink, color: C.ink }}
            >{cta}</Button>
          </MB>
        ))}
      </MB>
    </Box>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
function CTABand({ navigate }) {
  return (
    <Box as="section" display="grid" gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }} borderBottom={`1px solid ${C.border}`}>
      <MB
        initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
        bg={C.ink} px={{ base: '24px', md: '64px' }} py={{ base: '64px', md: '96px' }}
        position="relative" overflow="hidden"
        borderRight={{ lg: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Box position="absolute" top="-20%" right="-10%" w="500px" h="500px" borderRadius="full"
          style={{ background: 'radial-gradient(circle, rgba(184,131,42,0.12) 0%, transparent 65%)' }} pointerEvents="none" />
        <MB variants={fadeL}><MonoLabel light>06 — Start Today</MonoLabel></MB>
        <MB variants={fadeL}>
          <Text fontFamily="'Cormorant Garamond', serif" fontSize={{ base: '48px', md: '72px' }} fontWeight="300" lineHeight="0.95" letterSpacing="-0.025em" color={C.white} position="relative" zIndex={1}>
            Ready to transform<br />how your restaurant<br /><Text as="em" color={C.gold} fontStyle="italic">operates?</Text>
          </Text>
        </MB>
      </MB>
      <MB
        initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
        px={{ base: '24px', md: '64px' }} py={{ base: '64px', md: '96px' }}
        display="flex" flexDirection="column" justifyContent="center"
      >
        <MB variants={fadeR} mb="16px">
          <Text fontSize="15px" lineHeight="1.85" color={C.muted} maxW="400px">
            Join hundreds of restaurants already using RestoAI to reduce waste, boost margins, and run smarter every single day.
          </Text>
        </MB>
        <MB variants={fadeR} mb="28px">
          <VStack align="stretch" gap="10px" maxW="320px">
            <Button
              onClick={() => navigate('/register')}
              bg={C.ink} color={C.cream} borderRadius="0"
              fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase"
              h="48px" _hover={{ bg: C.gold }}
            >
              Start Your Free Trial <Icon as={ArrowRight} boxSize="13px" ml="8px" />
            </Button>
            <Button
              bg="transparent" color={C.muted}
              border={`1px solid ${C.border}`} borderRadius="0"
              fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase"
              h="48px" _hover={{ bg: C.surf, color: C.ink }}
            >
              Schedule a Demo
            </Button>
          </VStack>
        </MB>
        <MB variants={fadeR}>
          <VStack align="start" gap="10px">
            {[
              { text: 'No credit card required' },
              { text: '14-day free trial'       },
              { text: 'Expert support included' },
            ].map(({ text }) => (
              <Flex key={text} align="center" gap="10px">
                <Box w="4px" h="4px" bg={C.gold} />
                <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" textTransform="uppercase" color={C.muted}>{text}</Text>
              </Flex>
            ))}
          </VStack>
        </MB>
      </MB>
    </Box>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { title: 'Product', links: ['Features','Process','Pricing','Demo'] },
    { title: 'Company', links: ['About','Blog','Careers','Contact'] },
    { title: 'Legal',   links: ['Privacy','Terms','Cookies','Compliance'] },
  ];
  return (
    <Box as="footer" bg={C.ink} pt={{ base: '48px', md: '64px' }} pb="32px">
      <Grid
        templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }}
        gap="40px" px={{ base: '24px', md: '64px' }}
        mb="40px" pb="40px" borderBottom="1px solid rgba(255,255,255,0.06)"
      >
        <Box>
          <Flex align="center" gap="10px" mb="14px">
            <Box w="28px" h="28px" bg="#1e1b16" border="1px solid rgba(255,255,255,0.08)" display="flex" alignItems="center" justifyContent="center">
              <Icon as={ChefHat} boxSize="12px" color={C.gold} />
            </Box>
            <Text fontFamily="'Cormorant Garamond', serif" fontSize="18px" fontWeight="400" color={C.white}>
              Resto<Text as="em" color={C.gold} fontStyle="italic">AI</Text>
            </Text>
          </Flex>
          <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.07em" color="rgba(255,255,255,0.2)" lineHeight="1.9" maxW="200px">
            AI-powered restaurant management for operations that actually work.
          </Text>
        </Box>
        {cols.map(({ title, links }) => (
          <Box key={title}>
            <Text fontFamily="'DM Mono', monospace" fontSize="8px" letterSpacing="0.15em" textTransform="uppercase" color="rgba(255,255,255,0.22)" mb="16px">{title}</Text>
            <VStack align="start" gap="10px">
              {links.map(l => (
                <Text key={l} as="a" href="#" fontSize="12px" color="rgba(255,255,255,0.4)" _hover={{ color: C.white }} transition="color 0.2s">{l}</Text>
              ))}
            </VStack>
          </Box>
        ))}
      </Grid>
      <Flex px={{ base: '24px', md: '64px' }} justify="space-between" align="center" flexWrap="wrap" gap="8px">
        <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.06em" color="rgba(255,255,255,0.18)">
          © {new Date().getFullYear()} RestoAI. All rights reserved.
        </Text>
        <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.06em" color="rgba(255,255,255,0.1)">
          Made for restaurateurs worldwide
        </Text>
      </Flex>
    </Box>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
function HomePageInner() {
  const navigate = useNavigate?.() ?? (() => {});
  return (
    <Box bg={C.cream} minH="100vh" overflowX="hidden">
      {/* Font imports — move to index.html or _document for production */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Syne:wght@400;500;600;700&family=DM+Mono:ital,wght@0,300;1,300&display=swap"
        rel="stylesheet"
      />
      <Navbar navigate={navigate} />
      <Hero navigate={navigate} />
      <Marquee />
      <About />
      <Features />
      <Process />
      <Testimonials />
      <Pricing navigate={navigate} />
      <CTABand navigate={navigate} />
      <Footer />
    </Box>
  );
}

export default function HomePage() {
  return (
    <ChakraProvider theme={theme}>
      <HomePageInner />
    </ChakraProvider>
  );
}