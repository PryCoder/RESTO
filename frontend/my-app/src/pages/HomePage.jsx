import React, { useEffect, useState } from 'react';
import {
  ChakraProvider,
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Icon,
  HStack,
  VStack,
  Stack,
  Badge,
  SimpleGrid,
  Divider,
  Link,
  IconButton,
  useBreakpointValue,
  extendTheme,
  Circle,
  Wrap,
  WrapItem,
  useColorModeValue,
} from '@chakra-ui/react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import PizzaHero3D from '../components/PizzaHero3D';
import { useNavigate } from 'react-router-dom';
// Icons from lucide-react
import {
  Brain,
  Bot,
  TrendingUp,
  Mic,
  AlertCircle,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  DollarSign,
  Shield,
  Zap,
  Sparkles,
  ChefHat,
  ShoppingCart,
  Bell,
  MessageSquare,
  LogIn,
  UserPlus,
  ArrowRight,
  Star,
  Menu,
  X,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

// Custom theme with your fonts
const theme = extendTheme({
  fonts: {
    heading: `'ClashDisplay', 'Manrope', sans-serif`,
    body: `'SFProDisplay', 'Inter', sans-serif`,
    mono: `'Space Grotesk', monospace`,
  },
  styles: {
    global: {
      body: {
        bg: 'white',
        color: 'gray.800',
      },
    },
  },
  colors: {
    brand: {
      50: '#e6f0ff',
      100: '#b3d1ff',
      200: '#80b3ff',
      300: '#4d94ff',
      400: '#1a75ff',
      500: '#0066FF',
      600: '#0052cc',
      700: '#003d99',
      800: '#002966',
      900: '#001433',
    },
    accent: {
      50: '#e0fff5',
      100: '#b3ffe6',
      200: '#80ffd6',
      300: '#4dffc7',
      400: '#1affb8',
      500: '#00D4AA',
      600: '#00aa88',
      700: '#007f66',
      800: '#005544',
      900: '#002a22',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'full',
      },
      variants: {
        primary: {
          bg: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
          color: 'white',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: 'xl',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
        secondary: {
          bg: 'transparent',
          border: '2px solid',
          borderColor: 'gray.200',
          color: 'gray.700',
          _hover: {
            borderColor: 'brand.500',
            color: 'brand.500',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
  },
});

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionDiv = motion.div;

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const floatAnimation = {
  y: [0, -20, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const pulseAnimation = {
  opacity: [1, 0.5, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const spinAnimation = {
  rotate: 360,
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "linear"
  }
};

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const bgGradient = useColorModeValue(
    'linear(to-br, brand.50, white)',
    'linear(to-br, gray.900, gray.800)'
  );

  return (
    <ChakraProvider theme={theme}>
      <Box 
        position="relative" 
        minH="100vh" 
        overflow="hidden"
        bg="white"
        className="font-sfpro"
        _dark={{
          bg: 'gray.900',
          color: 'white',
        }}
      >
        {/* Background Elements */}
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bgGradient="radial(circle at 20% 80%, rgba(0, 212, 170, 0.15) 0%, rgba(0, 102, 255, 0.1) 25%, transparent 50%)"
          pointerEvents="none"
          zIndex="0"
        />

        {/* Grid Background with Parallax */}
        <MotionBox
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bgImage="linear-gradient(rgba(0, 102, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 102, 255, 0.03) 1px, transparent 1px)"
          bgSize={{ base: '30px 30px', md: '50px 50px' }}
          opacity="0.3"
          pointerEvents="none"
          zIndex="0"
          animate={{
            x: mousePosition.x * 0.02,
            y: mousePosition.y * 0.02,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        />

        {/* Floating Shapes with Framer Motion */}
        <MotionBox
          position="fixed"
          w={{ base: '200px', md: '400px' }}
          h={{ base: '200px', md: '400px' }}
          bg="brand.500"
          borderRadius="full"
          filter="blur(60px)"
          opacity="0.1"
          top="-100px"
          left="-100px"
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -40, 30, 0],
            rotate: [0, 120, 240, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          pointerEvents="none"
          zIndex="0"
        />

        <MotionBox
          position="fixed"
          w={{ base: '200px', md: '300px' }}
          h={{ base: '200px', md: '300px' }}
          bg="accent.500"
          borderRadius="full"
          filter="blur(60px)"
          opacity="0.1"
          bottom="-100px"
          right="-100px"
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 40, -30, 0],
            rotate: [0, 120, 240, 0],
          }}
          transition={{ duration: 20, delay: 5, repeat: Infinity, ease: 'linear' }}
          pointerEvents="none"
          zIndex="0"
        />

        {/* Glowing Orbs with Framer Motion */}
        <MotionBox
          position="fixed"
          w={{ base: '150px', md: '300px' }}
          h={{ base: '150px', md: '300px' }}
          bg="brand.500"
          borderRadius="full"
          filter="blur(40px)"
          opacity="0.2"
          top="20%"
          left="5%"
          animate={pulseAnimation}
          pointerEvents="none"
          zIndex="0"
        />

        <MotionBox
          position="fixed"
          w={{ base: '100px', md: '200px' }}
          h={{ base: '100px', md: '200px' }}
          bg="accent.500"
          borderRadius="full"
          filter="blur(40px)"
          opacity="0.2"
          bottom="20%"
          right="5%"
          animate={pulseAnimation}
          transition={{ delay: 2 }}
          pointerEvents="none"
          zIndex="0"
        />

        {/* Navigation */}
        <Box
          as="nav"
          position="fixed"
          top="0"
          left="0"
          right="0"
          zIndex="1000"
          py={4}
          bg="rgba(255, 255, 255, 0.8)"
          backdropFilter="blur(20px)"
          borderBottom="1px solid"
          borderColor="whiteAlpha.200"
          className="shadow-lg"
          _dark={{
            bg: 'rgba(23, 23, 23, 0.8)',
          }}
        >
          <Container maxW="1200px" px={{ base: 4, md: 8 }}>
            <Flex align="center" justify="space-between" wrap="wrap">
              {/* Logo */}
              <Flex align="center" gap={3}>
                <Circle size="48px" bgGradient="linear(135deg, brand.500, accent.500)" color="white">
                  <Icon as={ChefHat} boxSize={6} />
                </Circle>
                <Text
                  className="font-clash"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="bold"
                  color="gray.900"
                  _dark={{ color: 'white' }}
                >
                  Resto
                  <Text as="span" bgGradient="linear(135deg, brand.500, accent.500)" bgClip="text">
                    AI
                  </Text>
                </Text>
                <Badge
                  bgGradient="linear(135deg, accent.500, orange.400)"
                  color="white"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  display={{ base: 'none', md: 'block' }}
                  className="font-medium"
                >
                  PRO
                </Badge>
              </Flex>

              {/* Desktop Navigation */}
              <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
                <Link href="#features" color="gray.600" _hover={{ color: 'brand.500' }} display="flex" alignItems="center" gap={2}>
                  <Icon as={Zap} boxSize={4} />
                  Features
                </Link>
                <Link href="#how-it-works" color="gray.600" _hover={{ color: 'brand.500' }} display="flex" alignItems="center" gap={2}>
                  <Icon as={BarChart3} boxSize={4} />
                  How It Works
                </Link>
                <Link href="#pricing" color="gray.600" _hover={{ color: 'brand.500' }} display="flex" alignItems="center" gap={2}>
                  <Icon as={DollarSign} boxSize={4} />
                  Pricing
                </Link>
                <Link href="#testimonials" color="gray.600" _hover={{ color: 'brand.500' }} display="flex" alignItems="center" gap={2}>
                  <Icon as={Users} boxSize={4} />
                  Testimonials
                </Link>
              </HStack>

              {/* Desktop Actions */}
              <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
                <Button variant="secondary"  leftIcon={<Icon as={MessageSquare} boxSize={4} />}>
                <Link href="/login">
                  Business Sign In</Link>
                </Button>
                <Button variant="primary" leftIcon={<Icon as={Sparkles} boxSize={4} />}>
                <Link href="/register">
                  Get Started Free</Link>
                </Button>
              </HStack>

              {/* Mobile Menu Button */}
              <IconButton
                display={{ base: 'flex', md: 'none' }}
                icon={<Icon as={isMenuOpen ? X : Menu} boxSize={6} />}
                variant="ghost"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              />
            </Flex>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <MotionBox
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  overflow="hidden"
                  mt={4}
                >
                  <VStack spacing={4} align="stretch">
                    <Link href="#features" py={2} display="flex" alignItems="center" gap={2}>
                      <Icon as={Zap} boxSize={4} /> Features
                    </Link>
                    <Link href="#how-it-works" py={2} display="flex" alignItems="center" gap={2}>
                      <Icon as={BarChart3} boxSize={4} /> How It Works
                    </Link>
                    <Link href="#pricing" py={2} display="flex" alignItems="center" gap={2}>
                      <Icon as={DollarSign} boxSize={4} /> Pricing
                    </Link>
                    <Link href="#testimonials" py={2} display="flex" alignItems="center" gap={2}>
                      <Icon as={Users} boxSize={4} /> Testimonials
                    </Link>
                    <Divider />
                    <Button variant="secondary" w="full"  leftIcon={<Icon as={MessageSquare} boxSize={4} />}>
                    <Link href="/login"> Business Sign In</Link> 
                    </Button>
                    <Button variant="primary" w="full" leftIcon={<Icon as={Sparkles} boxSize={4} />}>
                    <Link href="/register"> Get Started Free</Link> 
                    </Button>
                  </VStack>
                </MotionBox>
              )}
            </AnimatePresence>
          </Container>
        </Box>

        {/* Hero Section */}
        <Box as="section" pt={{ base: '100px', md: '180px' }} pb={{ base: 16, md: 24 }} px={{ base: 4, md: 8 }} position="relative" zIndex="1">
          <Container maxW="1200px">
            <Stack direction={{ base: 'column', lg: 'row' }} spacing={{ base: 12, lg: 16 }} align="center">
              {/* Hero Content */}
              <MotionBox
                flex="1"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <VStack align={{ base: 'center', lg: 'start' }} spacing={8}>
                  <Badge
                    bgGradient="linear(135deg, brand.500, accent.500)"
                    color="white"
                    borderRadius="full"
                    px={4}
                    py={2}
                    fontSize="sm"
                    display="inline-flex"
                    alignItems="center"
                    gap={2}
                  >
                    <MotionBox as="span" animate={spinAnimation}>✨</MotionBox>
                    For Restaurant Owners
                  </Badge>

                  <Heading
                    className="font-clash"
                    fontSize={{ base: '4xl', md: '5xl', lg: '6xl' }}
                    fontWeight="bold"
                    lineHeight="1.1"
                    letterSpacing="-0.02em"
                    textAlign={{ base: 'center', lg: 'left' }}
                  >
                    <Text as="span" display="block">The Future of</Text>
                    <Text
                      as="span"
                      display="block"
                      bgGradient="linear(135deg, brand.500, accent.500)"
                      bgClip="text"
                    >
                      Restaurant Intelligence
                    </Text>
                    <Text as="span" display="block">Is Here</Text>
                  </Heading>

                  <Text
                    fontSize={{ base: 'lg', md: 'xl' }}
                    color="gray.600"
                    maxW="600px"
                    textAlign={{ base: 'center', lg: 'left' }}
                    _dark={{ color: 'gray.400' }}
                  >
                    AI-powered insights that predict demand, prevent waste, and maximize profits
                    in real-time. Transform your kitchen with predictive analytics.
                  </Text>

                  {/* Stats */}
                  <Flex
                    direction={{ base: 'column', md: 'row' }}
                    align="center"
                    gap={{ base: 4, md: 8 }}
                    p={6}
                    bg="rgba(255, 255, 255, 0.05)"
                    backdropFilter="blur(20px)"
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    w="full"
                    maxW="500px"
                  >
                    <VStack flex="1">
                      <Text className="font-space" fontSize="3xl" fontWeight="bold" color="brand.500">
                        40%
                      </Text>
                      <Text fontSize="sm" color="gray.500">Waste Reduction</Text>
                    </VStack>
                    <Divider orientation="vertical" h="40px" display={{ base: 'none', md: 'block' }} />
                    <Divider orientation="horizontal" w="full" display={{ base: 'block', md: 'none' }} />
                    <VStack flex="1">
                      <Text className="font-space" fontSize="3xl" fontWeight="bold" color="brand.500">
                        25%
                      </Text>
                      <Text fontSize="sm" color="gray.500">Profit Increase</Text>
                    </VStack>
                    <Divider orientation="vertical" h="40px" display={{ base: 'none', md: 'block' }} />
                    <Divider orientation="horizontal" w="full" display={{ base: 'block', md: 'none' }} />
                    <VStack flex="1">
                      <Text className="font-space" fontSize="3xl" fontWeight="bold" color="brand.500">
                        98%
                      </Text>
                      <Text fontSize="sm" color="gray.500">Accuracy Rate</Text>
                    </VStack>
                  </Flex>

                  {/* CTA Buttons */}
                  <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} w={{ base: 'full', sm: 'auto' }}>
                    <Button
                      variant="primary"
                      size="lg"
                      leftIcon={<Icon as={Sparkles} boxSize={5} />}
                      w={{ base: 'full', sm: 'auto' }}
                      position="relative"
                      overflow="hidden"
                      _hover={{
                        '& .glow': {
                          left: '100%',
                        },
                      }}
                    >
                      Start Free Trial
                      <Box
                        className="glow"
                        position="absolute"
                        top="0"
                        left="-100%"
                        w="full"
                        h="full"
                        bgGradient="linear(90deg, transparent, rgba(255,255,255,0.3), transparent)"
                        transition="left 0.8s"
                      />
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      leftIcon={<Icon as={Bot} boxSize={5} />}
                      w={{ base: 'full', sm: 'auto' }}
                    >
                      Watch Demo
                    </Button>
                  </Stack>
                </VStack>
              </MotionBox>

              {/* Hero Visual */}
              <MotionBox
                flex="1"
                position="relative"
                w="full"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <MotionBox
                  animate={{
                    rotateY: [0, -10, 0],
                    rotateX: [0, 5, 0],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Box
                    bg="rgba(255, 255, 255, 0.05)"
                    backdropFilter="blur(20px)"
                    borderRadius="3xl"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    p={8}
                    boxShadow="2xl"
                  >
                    <VStack spacing={6}>
                      <Flex justify="space-between" align="center" w="full">
                        <Text className="font-clash" fontWeight="600">Live Analytics</Text>
                        <Badge bgGradient="linear(135deg, accent.500, orange.400)" color="white" borderRadius="full" px={3} py={1}>
                          <Flex align="center" gap={2}>
                            <MotionBox w="6px" h="6px" bg="white" borderRadius="full" animate={pulseAnimation} />
                            LIVE
                          </Flex>
                        </Badge>
                      </Flex>

                      <SimpleGrid columns={2} spacing={4} w="full">
                        <Flex bg="white" p={4} borderRadius="xl" shadow="md" align="center" gap={3}>
                          <Circle size="40px" bgGradient="linear(135deg, brand.500, accent.500)" color="white">
                            <Icon as={TrendingUp} boxSize={5} />
                          </Circle>
                          <Box>
                            <Text className="font-space" fontSize="xl" fontWeight="bold">$12,450</Text>
                            <Text fontSize="sm" color="gray.500">Today's Revenue</Text>
                          </Box>
                        </Flex>

                        <Flex bg="white" p={4} borderRadius="xl" shadow="md" align="center" gap={3}>
                          <Circle size="40px" bgGradient="linear(135deg, brand.500, accent.500)" color="white">
                            <Icon as={ShoppingCart} boxSize={5} />
                          </Circle>
                          <Box>
                            <Text className="font-space" fontSize="xl" fontWeight="bold">-23%</Text>
                            <Text fontSize="sm" color="gray.500">Waste Reduced</Text>
                          </Box>
                        </Flex>
                      </SimpleGrid>

                      <Flex w="full" h="100px" align="flex-end" gap={2} p={4} bg="white" borderRadius="xl" shadow="md">
                        {[60, 40, 80, 30, 70].map((height, i) => (
                          <MotionBox
                            key={i}
                            flex="1"
                            h={`${height}%`}
                            bgGradient="linear(135deg, brand.500, accent.500)"
                            borderRadius="md"
                            animate={{
                              height: [`${height}%`, `${height + 15}%`, `${height}%`],
                            }}
                            transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
                          />
                        ))}
                      </Flex>
                    </VStack>
                  </Box>
                </MotionBox>

                {/* Floating Notifications */}
                <MotionBox
                  position="absolute"
                  top="-20px"
                  right="-20px"
                  bg="white"
                  p={4}
                  borderRadius="xl"
                  shadow="lg"
                  display="flex"
                  alignItems="center"
                  gap={3}
                  animate={floatAnimation}
                  zIndex="10"
                  display={{ base: 'none', md: 'flex' }}
                >
                  <Icon as={Bell} color="orange.500" />
                  <Text fontSize="sm">Low stock alert: Tomatoes</Text>
                </MotionBox>

                <MotionBox
                  position="absolute"
                  bottom="-20px"
                  left="-20px"
                  bgGradient="linear(135deg, brand.500, accent.500)"
                  color="white"
                  p={4}
                  borderRadius="xl"
                  shadow="lg"
                  display="flex"
                  alignItems="center"
                  gap={3}
                  animate={floatAnimation}
                  transition={{ delay: 1 }}
                  zIndex="10"
                  display={{ base: 'none', md: 'flex' }}
                >
                  <Icon as={CheckCircle} />
                  <Text fontSize="sm">Prediction: +15% sales tomorrow</Text>
                </MotionBox>
              </MotionBox>
            </Stack>
          </Container>
        </Box>

        {/* Customer Callout Section */}
        <Box as="section" py={{ base: 16, md: 24 }} px={{ base: 4, md: 8 }} bg="gray.50" _dark={{ bg: 'gray.800' }}>
          <Container maxW="800px" textAlign="center">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <VStack spacing={6}>
                <Heading
                  className="font-clash"
                  fontSize={{ base: '3xl', md: '4xl' }}
                  fontWeight="bold"
                >
                  Looking for Food?
                </Heading>
                <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.600" _dark={{ color: 'gray.400' }}>
                  Browse local restaurants, discover new dishes, and order your next meal with ease.
                </Text>
                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} w={{ base: 'full', md: 'auto' }}>
                  <Button colorScheme="brand" size="lg"><Link href="/restaurants">
                    Browse Restaurants</Link>
                  </Button>
                  <Button variant="outline" size="lg" leftIcon={<Icon as={LogIn} boxSize={4} />}><Link href="/customer-login">
                    Customer Login</Link>
                  </Button>
                  <Button variant="outline" size="lg" leftIcon={<Icon as={UserPlus} boxSize={4} />}><Link href="/register">
                    Customer Sign Up</Link>
                  </Button>
                </Stack>
              </VStack>
            </MotionBox>
          </Container>
        </Box>

        {/* Features Section */}
        <Box as="section" id="features" py={{ base: 16, md: 24 }} px={{ base: 4, md: 8 }} position="relative" zIndex="1">
          <Container maxW="1200px">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              textAlign="center"
              mb={16}
            >
              <Badge
                bgGradient="linear(135deg, accent.500, orange.400)"
                color="white"
                borderRadius="full"
                px={4}
                py={2}
                fontSize="sm"
                mb={4}
              >
                POWERFUL FEATURES
              </Badge>
              <Heading
                className="font-clash"
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="bold"
                mb={4}
              >
                Intelligent Kitchen Management
              </Heading>
              <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.600" maxW="600px" mx="auto" _dark={{ color: 'gray.400' }}>
                Advanced AI capabilities designed specifically for the modern restaurant
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
              {[
                {
                  icon: Brain,
                  title: 'Predictive Analytics',
                  description: 'AI-powered demand forecasting that analyzes historical data, weather, and events.',
                  tags: ['ML Algorithms', 'Real-time'],
                },
                {
                  icon: Bot,
                  title: 'Auto Inventory',
                  description: 'Smart inventory tracking with automated ordering and waste alerts.',
                  tags: ['Automation', 'Smart Alerts'],
                  highlighted: true,
                },
                {
                  icon: Mic,
                  title: 'Voice Control',
                  description: 'Hands-free operation with natural language processing.',
                  tags: ['NLP', 'Hands-free'],
                },
                {
                  icon: AlertCircle,
                  title: 'Risk Alerts',
                  description: 'Proactive notifications for potential issues before they affect your business.',
                  tags: ['Predictive', 'Proactive'],
                },
              ].map((feature, index) => (
                <MotionBox
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Box
                    bg={feature.highlighted ? 'brand.500' : 'white'}
                    color={feature.highlighted ? 'white' : 'gray.900'}
                    p={8}
                    borderRadius="2xl"
                    shadow="lg"
                    position="relative"
                    overflow="hidden"
                    _hover={{
                      transform: 'translateY(-8px)',
                      shadow: '2xl',
                    }}
                    transition="all 0.3s"
                    h="full"
                  >
                    <Circle
                      size="64px"
                      bg={feature.highlighted ? 'white' : 'brand.500'}
                      color={feature.highlighted ? 'brand.500' : 'white'}
                      mb={6}
                    >
                      <Icon as={feature.icon} boxSize={6} />
                    </Circle>
                    <Heading fontSize="xl" mb={4} className="font-clash">
                      {feature.title}
                    </Heading>
                    <Text
                      fontSize="sm"
                      color={feature.highlighted ? 'whiteAlpha.900' : 'gray.600'}
                      mb={6}
                      lineHeight="tall"
                    >
                      {feature.description}
                    </Text>
                    <HStack spacing={2}>
                      {feature.tags.map((tag, i) => (
                        <Badge
                          key={i}
                          bg={feature.highlighted ? 'whiteAlpha.200' : 'gray.100'}
                          color={feature.highlighted ? 'white' : 'gray.700'}
                          borderRadius="full"
                          px={3}
                          py={1}
                          fontSize="xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* How It Works Section */}
        <Box as="section" id="how-it-works" py={{ base: 16, md: 24 }} px={{ base: 4, md: 8 }} bg="gray.50" _dark={{ bg: 'gray.800' }}>
          <Container maxW="1200px">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              textAlign="center"
              mb={16}
            >
              <Badge
                bgGradient="linear(135deg, accent.500, orange.400)"
                color="white"
                borderRadius="full"
                px={4}
                py={2}
                fontSize="sm"
                mb={4}
              >
                SIMPLE WORKFLOW
              </Badge>
              <Heading
                className="font-clash"
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="bold"
              >
                From Chaos to Control in 4 Steps
              </Heading>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} position="relative">
              {[
                {
                  number: '01',
                  icon: ShoppingCart,
                  title: 'Connect Inventory',
                  description: 'Sync your current inventory or start fresh with our smart tracking',
                },
                {
                  number: '02',
                  icon: Mic,
                  title: 'Voice Input',
                  description: 'Speak your sales and updates naturally—no typing needed',
                },
                {
                  number: '03',
                  icon: Brain,
                  title: 'AI Analysis',
                  description: 'Our algorithms process data and generate actionable insights',
                },
                {
                  number: '04',
                  icon: Bell,
                  title: 'Smart Decisions',
                  description: 'Receive precise recommendations for ordering and preparation',
                },
              ].map((step, index) => (
                <MotionBox
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  position="relative"
                >
                  <Box
                    bg="white"
                    p={8}
                    borderRadius="2xl"
                    shadow="lg"
                    textAlign="center"
                    position="relative"
                    _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
                    transition="all 0.3s"
                    _dark={{ bg: 'gray.700' }}
                  >
                    <Circle
                      position="absolute"
                      top="-12px"
                      left="50%"
                      transform="translateX(-50%)"
                      size="40px"
                      bgGradient="linear(135deg, brand.500, accent.500)"
                      color="white"
                      fontWeight="bold"
                      className="font-space"
                    >
                      {step.number}
                    </Circle>
                    <Circle
                      size="64px"
                      bgGradient="linear(135deg, brand.500, accent.500)"
                      color="white"
                      mx="auto"
                      mb={6}
                      mt={2}
                    >
                      <Icon as={step.icon} boxSize={6} />
                    </Circle>
                    <Heading fontSize="xl" mb={4} className="font-clash">
                      {step.title}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" lineHeight="tall" _dark={{ color: 'gray.400' }}>
                      {step.description}
                    </Text>
                  </Box>
                  {index < 3 && (
                    <Box
                      position="absolute"
                      top="50%"
                      right="-40px"
                      transform="translateY(-50%)"
                      display={{ base: 'none', lg: 'block' }}
                    >
                      <Circle size="32px" bgGradient="linear(135deg, brand.500, accent.500)" color="white">
                        <Icon as={ArrowRight} boxSize={5} />
                      </Circle>
                    </Box>
                  )}
                </MotionBox>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* 3D Visualization */}
        <Box as="section" py={{ base: 16, md: 24 }} px={{ base: 4, md: 8 }}>
          <Container maxW="1200px">
            <Stack direction={{ base: 'column', lg: 'row' }} spacing={12} align="center">
              <MotionBox
                flex="1"
                h={{ base: '300px', md: '400px' }}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <PizzaHero3D />
              </MotionBox>
              <MotionBox
                flex="1"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <VStack align="start" spacing={6}>
                  <Heading
                    className="font-clash"
                    fontSize={{ base: '3xl', md: '4xl' }}
                    fontWeight="bold"
                  >
                    See Your Data Come Alive
                  </Heading>
                  <Text fontSize="lg" color="gray.600" _dark={{ color: 'gray.400' }}>
                    Interactive 3D visualizations of your restaurant's performance metrics.
                    Watch as patterns emerge and opportunities reveal themselves.
                  </Text>
                  <SimpleGrid columns={3} spacing={4} w="full">
                    {[
                      { value: '360°', label: 'Data View' },
                      { value: 'Real-time', label: 'Updates' },
                      { value: 'Interactive', label: 'Exploration' },
                    ].map((stat, index) => (
                      <VStack key={index} spacing={1}>
                        <Text className="font-space" fontSize="xl" fontWeight="bold" color="brand.500">
                          {stat.value}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {stat.label}
                        </Text>
                      </VStack>
                    ))}
                  </SimpleGrid>
                </VStack>
              </MotionBox>
            </Stack>
          </Container>
        </Box>

        {/* Testimonials */}
        <Box as="section" id="testimonials" py={{ base: 16, md: 24 }} px={{ base: 4, md: 8 }} bg="gray.50" _dark={{ bg: 'gray.800' }}>
          <Container maxW="1200px">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              textAlign="center"
              mb={16}
            >
              <Badge
                bgGradient="linear(135deg, accent.500, orange.400)"
                color="white"
                borderRadius="full"
                px={4}
                py={2}
                fontSize="sm"
                mb={4}
              >
                TRUSTED BY INDUSTRY LEADERS
              </Badge>
              <Heading
                className="font-clash"
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="bold"
              >
                Success Stories
              </Heading>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
              {[
                {
                  quote: "RestoAI transformed how we manage inventory. We reduced food waste by 42% in the first month alone.",
                  author: 'Rajesh Chopra',
                  role: 'Owner, Spice Route Mumbai',
                  initials: 'RC',
                  highlighted: false,
                },
                {
                  quote: "The voice input feature is revolutionary. Our kitchen staff can update sales without leaving their stations.",
                  author: 'Shweta Patel',
                  role: 'Head Chef, Urban Kitchen Delhi',
                  initials: 'SP',
                  highlighted: true,
                },
                {
                  quote: "As a multi-location operator, the centralized dashboard gives me real-time visibility across all restaurants.",
                  author: 'Amit Kumar',
                  role: 'CEO, FoodChain India',
                  initials: 'AK',
                  highlighted: false,
                },
              ].map((testimonial, index) => (
                <MotionBox
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Box
                    bg={testimonial.highlighted ? 'brand.500' : 'white'}
                    color={testimonial.highlighted ? 'white' : 'gray.900'}
                    p={8}
                    borderRadius="2xl"
                    shadow="lg"
                    position="relative"
                    _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
                    transition="all 0.3s"
                    h="full"
                  >
                    <Text
                      position="absolute"
                      top="-20px"
                      left="8"
                      className="font-betania"
                      fontSize="6xl"
                      color={testimonial.highlighted ? 'whiteAlpha.400' : 'brand.200'}
                    >
                      "
                    </Text>
                    <Text fontSize="md" mb={8} fontStyle="italic" lineHeight="tall" mt={8}>
                      {testimonial.quote}
                    </Text>
                    <Flex align="center" gap={4}>
                      <Circle
                        size="48px"
                        bg={testimonial.highlighted ? 'white' : 'brand.500'}
                        color={testimonial.highlighted ? 'brand.500' : 'white'}
                        fontWeight="bold"
                      >
                        {testimonial.initials}
                      </Circle>
                      <Box>
                        <Text fontWeight="bold">{testimonial.author}</Text>
                        <Text fontSize="sm" color={testimonial.highlighted ? 'whiteAlpha.800' : 'gray.500'}>
                          {testimonial.role}
                        </Text>
                      </Box>
                    </Flex>
                    <HStack spacing={1} mt={4} color="yellow.400">
                      {[...Array(5)].map((_, i) => (
                        <Icon key={i} as={Star} boxSize={4} fill="currentColor" />
                      ))}
                    </HStack>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* Pricing */}
        <Box as="section" id="pricing" py={{ base: 16, md: 24 }} px={{ base: 4, md: 8 }}>
          <Container maxW="1200px">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              textAlign="center"
              mb={16}
            >
              <Badge
                bgGradient="linear(135deg, accent.500, orange.400)"
                color="white"
                borderRadius="full"
                px={4}
                py={2}
                fontSize="sm"
                mb={4}
              >
                FLEXIBLE PLANS
              </Badge>
              <Heading
                className="font-clash"
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="bold"
                mb={4}
              >
                Choose Your Plan
              </Heading>
              <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.600" _dark={{ color: 'gray.400' }}>
                Start with our free plan and upgrade as you grow
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} maxW="1000px" mx="auto">
              {[
                {
                  name: 'STARTER',
                  price: 0,
                  description: 'Perfect for small restaurants getting started',
                  features: [
                    'Basic inventory tracking',
                    'Weekly waste reports',
                    'Email support',
                  ],
                  popular: false,
                },
                {
                  name: 'PROFESSIONAL',
                  price: 49,
                  description: 'For growing restaurants that need advanced features',
                  features: [
                    'AI demand forecasting',
                    'Voice input & control',
                    'Multi-location support',
                    'Priority support',
                    'Advanced analytics',
                  ],
                  popular: true,
                },
                {
                  name: 'ENTERPRISE',
                  price: 199,
                  description: 'For large restaurant chains and franchises',
                  features: [
                    'Everything in Professional',
                    'Custom integrations',
                    'Dedicated account manager',
                    'API access',
                    'On-premise deployment',
                  ],
                  popular: false,
                },
              ].map((plan, index) => (
                <MotionBox
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  position="relative"
                >
                  {plan.popular && (
                    <Badge
                      position="absolute"
                      top="-12px"
                      left="50%"
                      transform="translateX(-50%)"
                      bgGradient="linear(135deg, accent.500, orange.400)"
                      color="white"
                      borderRadius="full"
                      px={4}
                      py={1}
                      fontSize="xs"
                      whiteSpace="nowrap"
                      zIndex="2"
                    >
                      MOST POPULAR
                    </Badge>
                  )}
                  <Box
                    bg="white"
                    p={8}
                    borderRadius="2xl"
                    shadow={plan.popular ? 'xl' : 'lg'}
                    border={plan.popular ? '2px solid' : '1px solid'}
                    borderColor={plan.popular ? 'brand.500' : 'gray.200'}
                    position="relative"
                    transform={plan.popular ? { lg: 'scale(1.05)' } : 'none'}
                    _hover={{
                      transform: plan.popular ? { lg: 'scale(1.05) translateY(-4px)' } : 'translateY(-4px)',
                      shadow: 'xl',
                    }}
                    transition="all 0.3s"
                    h="full"
                    _dark={{
                      bg: 'gray.700',
                      borderColor: plan.popular ? 'brand.500' : 'gray.600',
                    }}
                  >
                    <Text className="font-clash" fontSize="lg" fontWeight="bold" mb={4}>
                      {plan.name}
                    </Text>
                    <Flex align="baseline" gap={1} mb={4}>
                      <Text as="span" fontSize="2xl" color="gray.500">$</Text>
                      <Text as="span" className="font-space" fontSize="5xl" fontWeight="bold">
                        {plan.price}
                      </Text>
                      <Text as="span" fontSize="lg" color="gray.500">/month</Text>
                    </Flex>
                    <Text fontSize="sm" color="gray.600" mb={8} _dark={{ color: 'gray.400' }}>
                      {plan.description}
                    </Text>
                    <VStack spacing={4} align="stretch" mb={8}>
                      {plan.features.map((feature, i) => (
                        <Flex key={i} align="center" gap={3}>
                          <Icon as={CheckCircle} color="accent.500" boxSize={5} />
                          <Text fontSize="sm">{feature}</Text>
                        </Flex>
                      ))}
                    </VStack>
                    <Button
                      w="full"
                      variant={plan.popular ? 'primary' : 'secondary'}
                      size="lg"
                    >
                      {plan.price === 0 ? 'Get Started Free' : plan.name === 'ENTERPRISE' ? 'Contact Sales' : 'Start 14-Day Trial'}
                    </Button>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* Final CTA */}
        <Box as="section" py={{ base: 16, md: 24 }} px={{ base: 4, md: 8 }}>
          <Container maxW="800px">
            <MotionBox
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Box
                bgGradient="linear(135deg, brand.500, accent.500)"
                borderRadius="3xl"
                p={{ base: 8, md: 16 }}
                textAlign="center"
                color="white"
                position="relative"
                overflow="hidden"
              >
                <VStack spacing={8} position="relative" zIndex="2">
                  <Heading
                    className="font-clash"
                    fontSize={{ base: '3xl', md: '4xl' }}
                    fontWeight="bold"
                  >
                    Ready to Transform Your Restaurant?
                  </Heading>
                  <Text fontSize={{ base: 'lg', md: 'xl' }} opacity="0.9" maxW="600px">
                    Join thousands of restaurants already using RestoAI to reduce waste,
                    increase profits, and make smarter decisions every day.
                  </Text>
                  <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                    <Button
                      size="lg"
                      bg="white"
                      color="brand.500"
                      _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
                      leftIcon={<Icon as={Sparkles} boxSize={5} />}
                    >
                      Start Your Free Trial
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      borderColor="white"
                      color="white"
                      _hover={{ bg: 'whiteAlpha.200' }}
                    >
                      Schedule a Demo
                    </Button>
                  </Stack>
                  <Wrap spacing={8} justify="center">
                    <WrapItem>
                      <HStack spacing={2}>
                        <Icon as={Shield} />
                        <Text fontSize="sm">No credit card required</Text>
                      </HStack>
                    </WrapItem>
                    <WrapItem>
                      <HStack spacing={2}>
                        <Icon as={Clock} />
                        <Text fontSize="sm">14-day free trial</Text>
                      </HStack>
                    </WrapItem>
                    <WrapItem>
                      <HStack spacing={2}>
                        <Icon as={Users} />
                        <Text fontSize="sm">24/7 support included</Text>
                      </HStack>
                    </WrapItem>
                  </Wrap>
                </VStack>
                <MotionBox
                  position="absolute"
                  top="0"
                  left="-100%"
                  w="full"
                  h="full"
                  bgGradient="linear(90deg, transparent, rgba(255,255,255,0.1), transparent)"
                  animate={{
                    left: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </Box>
            </MotionBox>
          </Container>
        </Box>

        {/* Footer */}
        <Box as="footer" bg="gray.900" color="white" py={{ base: 12, md: 16 }} px={{ base: 4, md: 8 }}>
          <Container maxW="1200px">
            <Stack direction={{ base: 'column', lg: 'row' }} spacing={12} mb={12}>
              <Box flex="1">
                <Flex align="center" gap={3} mb={6}>
                  <Circle size="48px" bgGradient="linear(135deg, brand.500, accent.500)" color="white">
                    <Icon as={ChefHat} boxSize={6} />
                  </Circle>
                  <Text className="font-clash" fontSize="2xl" fontWeight="bold">
                    Resto
                    <Text as="span" bgGradient="linear(135deg, brand.500, accent.500)" bgClip="text">
                      AI
                    </Text>
                  </Text>
                </Flex>
                <Text color="gray.400" mb={6} maxW="300px">
                  Intelligent restaurant management powered by AI
                </Text>
                <HStack spacing={6}>
                  <Link href="#" color="gray.400" _hover={{ color: 'white' }}>Twitter</Link>
                  <Link href="#" color="gray.400" _hover={{ color: 'white' }}>LinkedIn</Link>
                  <Link href="#" color="gray.400" _hover={{ color: 'white' }}>Instagram</Link>
                  <Link href="#" color="gray.400" _hover={{ color: 'white' }}>GitHub</Link>
                </HStack>
              </Box>

              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} flex="2">
                {[
                  {
                    title: 'Product',
                    links: ['Features', 'How It Works', 'Pricing', 'Demo'],
                  },
                  {
                    title: 'Company',
                    links: ['About Us', 'Careers', 'Blog', 'Press'],
                  },
                  {
                    title: 'Resources',
                    links: ['Documentation', 'Help Center', 'Community', 'Contact'],
                  },
                  {
                    title: 'Legal',
                    links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance'],
                  },
                ].map((group, index) => (
                  <VStack key={index} align="start" spacing={4}>
                    <Text fontWeight="bold" color="white">{group.title}</Text>
                    {group.links.map((link, i) => (
                      <Link key={i} href="#" color="gray.400" _hover={{ color: 'white' }} fontSize="sm">
                        {link}
                      </Link>
                    ))}
                  </VStack>
                ))}
              </SimpleGrid>
            </Stack>

            <Divider borderColor="gray.800" />

            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" pt={8}>
              <Text color="gray.400" fontSize="sm" mb={{ base: 4, md: 0 }}>
                © {new Date().getFullYear()} RestoAI. All rights reserved.
              </Text>
              <Text color="gray.500" fontSize="sm">
                Made with ❤️ for restaurateurs worldwide
              </Text>
            </Flex>
          </Container>
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default HomePage;