import React, { useEffect, useMemo, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockEndorsements } from "../../data/mockEndorsements";

const SUPPORTED_RATIOS = ["9:16", "2:3", "16:9"];
const RATIO_CLASS_MAP = {
  "9:16": "aspect-[9/16]",
  "2:3": "aspect-[2/3]",
  "16:9": "aspect-video"
};

function normalizeEndorsement(item, index) {
  const ratioCandidate = item.ratioType || item.ratio_type || SUPPORTED_RATIOS[index % SUPPORTED_RATIOS.length];
  const ratioType = SUPPORTED_RATIOS.includes(ratioCandidate) ? ratioCandidate : "2:3";
  const mediaTypeCandidate = String(item.mediaType || item.media_type || "image").toLowerCase();
  const mediaType = mediaTypeCandidate === "video" ? "video" : "image";
  const isActiveCandidate = item.isActive ?? item.is_active ?? true;

  return {
    id: item.id || `endorsement-${index + 1}`,
    talentName: item.talentName || item.name || "Talent Name",
    roleOrTag: item.roleOrTag || item.role_or_tag || "Brand Ambassador",
    ratioType,
    mediaType,
    mediaPath: item.mediaPath || item.media_path || item.image_path || item.imagePath || "",
    mediaUrlPlaceholder: item.mediaUrlPlaceholder || "",
    caption: item.caption || "Endorsement caption placeholder.",
    isActive: isActiveCandidate === true || isActiveCandidate === "true" || isActiveCandidate === 1 || isActiveCandidate === "1"
  };
}

function resolveMediaUrl(item) {
  if (item.mediaPath && item.mediaPath.startsWith("http")) return item.mediaPath;
  if (item.mediaPath) return `${import.meta.env.VITE_API_URL}${item.mediaPath}`;
  if (item.mediaUrlPlaceholder) return item.mediaUrlPlaceholder;
  return "";
}

function EndorsementCard({ item, index }) {
  const aspectClass = RATIO_CLASS_MAP[item.ratioType] || RATIO_CLASS_MAP["2:3"];
  const mediaUrl = resolveMediaUrl(item);
  const isVideo = item.mediaType === "video";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="rounded-none border-zinc-800 bg-zinc-900/50 text-zinc-50 transition-colors hover:border-zinc-600">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline" className="rounded-none border-zinc-700 text-zinc-400 text-[10px] uppercase tracking-widest">
              {item.ratioType}
            </Badge>
            <Badge variant="outline" className="rounded-none border-zinc-700 text-zinc-500 text-[10px] uppercase tracking-widest">
              {item.roleOrTag}
            </Badge>
          </div>
          <CardTitle className="text-zinc-100 font-mono uppercase tracking-wide text-sm">
            {item.talentName}
          </CardTitle>
          <CardDescription className="font-mono uppercase tracking-wide text-[10px] text-zinc-500">
            Worn By
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className={`w-full ${aspectClass} overflow-hidden border border-dashed border-zinc-700 bg-zinc-800`}>
            {mediaUrl ? (
              <img
                src={mediaUrl}
                alt={`${item.talentName} endorsement`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                  {isVideo ? "Video Placeholder" : "Image Placeholder"}
                </span>
                <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                  {item.ratioType} / Ambassador Media
                </span>
              </div>
            )}
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            {item.caption}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function EndorsementCarousel() {
  const [endorsements, setEndorsements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEndorsements = async () => {
      try {
        const res = await axios.get(import.meta.env.VITE_API_URL + "/api/endorsements");
        const data = Array.isArray(res.data) ? res.data : [];
        const normalized = data.map(normalizeEndorsement).filter((item) => item.isActive);
        setEndorsements(normalized);
      } catch (error) {
        console.error("Error fetching endorsements:", error);
        setEndorsements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEndorsements();
  }, []);

  const displayItems = useMemo(() => {
    if (endorsements.length > 0) return endorsements;
    return mockEndorsements.map(normalizeEndorsement);
  }, [endorsements]);

  return (
    <section className="w-full bg-zinc-950 border-y border-zinc-800/60 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 flex flex-col gap-5"
        >
          <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
            [ ENDORSEMENT ]
          </span>
          <h2 className="text-4xl md:text-[4.5vw] font-black leading-none tracking-tighter uppercase text-zinc-50">
            Worn By Artists <span className="text-zinc-600">&amp; Ambassadors</span>
          </h2>
          <p className="max-w-2xl text-zinc-400 leading-relaxed">
            A curated editorial section featuring talents wearing Reload pieces. Each card supports flexible media ratios for photos and short clips.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-none border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="mb-4 h-4 w-24 bg-zinc-800" />
                <div className="aspect-[2/3] w-full bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {displayItems.map((item, index) => (
              <EndorsementCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
