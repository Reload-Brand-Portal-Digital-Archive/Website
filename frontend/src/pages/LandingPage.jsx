// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
// eslint-disable-next-line no-unused-vars
import { useNavigate, Link } from "react-router-dom"
import Navbar from "../components/ui/Navbar"

function HeroSkeleton() {
  return (
    <header className="relative w-full min-h-[100dvh] bg-zinc-950 px-4 py-8 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
      {/* 
        Rule Check: Asymmetric Layout (DESIGN_VARIANCE=8). 
        Left-aligned giant typography, right side raw image/video setup.
      */}
      <div className="order-2 md:order-1 col-span-1 md:col-span-5 flex flex-col gap-6">
        {/* TODO: Add typography stagger reveal variants */}
        <h1 className="text-6xl md:text-[8vw] text-zinc-50 font-sans font-bold leading-none tracking-tighter uppercase whitespace-pre-line">
          Embrace{`\n`}The Decay.
        </h1>
        <p className="text-base text-zinc-400 max-w-[40ch] leading-relaxed">
          Limited edition drops bridging the gap between digital brutalism and physical streetwear.
        </p>
      </div>

      <div className="order-1 md:order-2 col-span-1 md:col-span-7 h-[50vh] md:h-full w-full bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden">
        {/* TODO: Setup 3D Canvas / Video / Grainy Image parallax component */}
        <span className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em]">[ 01 : CAMPAIGN VISUAL ]</span>
      </div>
    </header>
  )
}

function FeaturedCollectionsSkeleton() {
  return (
    <section className="w-full px-4 py-32 md:py-48 max-w-[1600px] mx-auto text-zinc-50 bg-zinc-950 font-sans">
      <h2 className="text-4xl md:text-[5vw] font-bold leading-none tracking-tighter uppercase mb-16 md:mb-24">
        Archive // 01
      </h2>

      {/* Rule Check: Masonry/Asymmetric UI, w-full fallback on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4 md:gap-8">

        {/* Main large collection card */}
        <Card className="group relative aspect-square md:aspect-[4/3] w-full bg-zinc-900 border-zinc-800 rounded-none overflow-hidden text-zinc-50">
          <CardContent className="h-full flex flex-col justify-between p-8">
            <div className="z-10 flex justify-between items-start">
              <span className="text-xs font-mono text-zinc-400">[ FV-01 ]</span>
              <Badge variant="outline" className="border-zinc-500 text-zinc-300 uppercase tracking-widest rounded-none text-[10px]">Limited Edition</Badge>
            </div>
            <div className="z-10">
              <h3 className="text-2xl font-bold uppercase tracking-tight">Null Protocol</h3>
              <p className="text-sm text-zinc-400 mt-2">Available Now</p>
            </div>
          </CardContent>
        </Card>

        {/* Smaller side cards */}
        <Card className="group relative aspect-square w-full bg-zinc-900 border-zinc-800 rounded-none text-zinc-50">
          <CardContent className="h-full flex flex-col justify-between p-8">
            <div className="z-10 flex justify-between items-start">
              <span className="text-xs font-mono text-zinc-400">[ FV-02 ]</span>
            </div>
            <div className="z-10">
              <h3 className="text-xl font-bold uppercase tracking-tight">Core Dump</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative aspect-square w-full bg-zinc-900 border-zinc-800 rounded-none text-zinc-50">
          <CardContent className="h-full flex flex-col justify-between p-8">
            <div className="z-10 flex justify-between items-start">
              <span className="text-xs font-mono text-zinc-400">[ FV-03 ]</span>
              <Badge variant="destructive" className="uppercase tracking-widest rounded-none text-[10px]">Sold Out</Badge>
            </div>
            <div className="z-10">
              <h3 className="text-xl font-bold uppercase tracking-tight">Syntax Error</h3>
            </div>
          </CardContent>
        </Card>

      </div>
    </section>
  )
}

function ShopCTASkeleton() {
  return (
    <section className="w-full px-4 py-32 md:py-48 bg-zinc-900 text-zinc-50 border-y border-zinc-800 font-sans">
      {/* Rule Check: Split screen asymmetric CTA setup */}
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row gap-16 md:items-end justify-between">
        <div className="max-w-[15ch]">
          <h2 className="text-5xl md:text-[6vw] font-bold leading-none tracking-tighter uppercase">
            Secure The Drop
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* TODO: Add Framer Motion magnetic button physics here */}
          <Button size="lg" className="bg-zinc-50 text-zinc-950 font-bold uppercase text-sm tracking-widest hover:bg-zinc-200 transition-colors w-full sm:w-auto rounded-none h-14 px-8">
            Shop Tiktok
          </Button>
          <Button variant="outline" size="lg" className="border-zinc-50 text-zinc-50 bg-transparent font-bold uppercase text-sm tracking-widest hover:bg-zinc-800 hover:text-zinc-50 transition-colors w-full sm:w-auto rounded-none h-14 px-8">
            Shop Shopee
          </Button>
        </div>
      </div>
    </section>
  )
}

function NewsletterSkeleton() {
  return (
    <section className="w-full px-4 py-32 md:py-48 max-w-[1600px] mx-auto text-zinc-50 bg-zinc-950 font-sans">
      {/* Rule Check: Minimal density (3), No card containers, massive typography */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-16">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-5xl font-bold leading-none tracking-tighter uppercase">
            Intel Overload
          </h2>
          <p className="text-zinc-400 mt-6 leading-relaxed">
            Join the grid. Receive encrypted frequencies regarding early access drops, location-based popups, and restocks.
          </p>
        </div>

        <form className="w-full md:max-w-md relative">
          <div className="relative w-full">
            {/* TODO: Setup custom fluid states, Liquid glass push on submit */}
            <div className="flex items-center border-b border-zinc-700 focus-within:border-zinc-50 transition-colors">
              <Input
                type="email"
                placeholder="ENTER EMAIL ADDRESS_"
                className="w-full bg-transparent border-0 py-6 text-zinc-50 font-mono text-sm uppercase placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 rounded-none h-auto"
              />
              <Button type="button" variant="ghost" className="text-xs font-bold tracking-[0.2em] text-zinc-400 hover:text-zinc-50 hover:bg-transparent uppercase px-0 h-auto">
                [ Submit ]
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}

function FooterSkeleton() {
  return (
    <footer className="w-full bg-zinc-950 text-zinc-50 px-4 pt-32 pb-8 border-t border-zinc-900 font-sans flex flex-col justify-between min-h-[50vh]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[1600px] mx-auto w-full mb-32">
        {/* Dense minimal links setup */}
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase font-mono text-zinc-500 mb-2">[ COMMERCE ]</span>
          <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Tiktok Shop</a>
          <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Shopee Mall</a>
          <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Shipping & Returns</a>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase font-mono text-zinc-500 mb-2">[ INFO ]</span>
          <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">About RELOAD</a>
          <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Contact</a>
          <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Terms of Service</a>
        </div>
      </div>

      <Separator className="bg-zinc-900 w-full mb-8 max-w-[1600px] mx-auto absolute top-0" />
      <div className="w-full text-center overflow-hidden flex flex-col items-center">
        {/* Massive responsive brand text cutting off slightly on purpose */}
        <h1 className="text-[20vw] font-bold leading-[0.75] tracking-tighter uppercase text-zinc-900 select-none">
          RELOAD
        </h1>
        <div className="flex w-full justify-between items-center text-xs text-zinc-600 font-mono uppercase tracking-widest mt-8 px-4">
          <span>© {new Date().getFullYear()} RELOAD Distro</span>
          <span>Initiate Sequence</span>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans cursor-default selection:bg-white selection:text-black">
      <Navbar />
      <HeroSkeleton />
      <FeaturedCollectionsSkeleton />
      <ShopCTASkeleton />
      <NewsletterSkeleton />
      <FooterSkeleton />
    </div>
  )
}
