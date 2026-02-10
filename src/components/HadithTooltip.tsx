import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen } from "lucide-react";

export interface HadithData {
  shortText: string;
  fullText: string;
  source: string;
  link: string;
  grade?: string;
  arabic?: string;
}

export const VERIFIED_HADITHS: Record<string, HadithData> = {
  muslim_666: {
    shortText: "Each step erases a sin and raises a degree.",
    fullText:
      "Abu Huraira reported: The Messenger of Allah (ﷺ) said, \"When one of you performs ablution and does it well, then he goes out to the mosque, having no purpose except prayer, he does not take one step but Allah raises him a degree thereby and removes from him one sin, until he enters the mosque. When he enters the mosque, he is in a state of prayer as long as he is waiting for the prayer.\"",
    source: "Sahih Muslim 666",
    link: "https://sunnah.com/muslim:666",
    grade: "Sahih (Authentic)",
    arabic: "لاَ يَخْطُو خَطْوَةً إِلاَّ رُفِعَ لَهُ بِهَا دَرَجَةٌ وَحُطَّ عَنْهُ بِهَا خَطِيئَةٌ",
  },
  abudawud_561: {
    shortText: "Those who walk in darkness get perfect light on the Day of Resurrection.",
    fullText:
      "Buraida reported: The Prophet (ﷺ) said, \"Give glad tidings to those who walk to the mosques in darkness, of perfect light on the Day of Resurrection.\"",
    source: "Sunan Abi Dawud 561",
    link: "https://sunnah.com/abudawud:561",
    grade: "Sahih (Authentic)",
    arabic: "بَشِّرِ الْمَشَّائِينَ فِي الظُّلَمِ إِلَى الْمَسَاجِدِ بِالنُّورِ التَّامِّ يَوْمَ الْقِيَامَةِ",
  },
  bukhari_636: {
    shortText: "Walk with tranquility and solemnity, do not run.",
    fullText:
      "Abu Huraira reported: The Prophet (ﷺ) said, \"When the iqamah is pronounced, do not come to it running, but come walking in tranquility. Pray what you catch up with, and complete what you have missed.\"",
    source: "Sahih al-Bukhari 636",
    link: "https://sunnah.com/bukhari:636",
    grade: "Sahih (Authentic)",
    arabic: "إِذَا أُقِيمَتِ الصَّلاَةُ فَلاَ تَأْتُوهَا تَسْعَوْنَ وَأْتُوهَا تَمْشُونَ وَعَلَيْكُمُ السَّكِينَةُ",
  },
  muslim_662: {
    shortText: "The farthest walkers receive the greatest reward.",
    fullText:
      "Abu Musa reported: The Prophet (ﷺ) said, \"The people who will receive the greatest reward for prayer are those who live farthest away, and then those who live farthest away. The one who waits for the prayer to offer it with the Imam has a greater reward than the one who prays and then goes to sleep.\"",
    source: "Sahih Muslim 662",
    link: "https://sunnah.com/muslim:662",
    grade: "Sahih (Authentic)",
    arabic: "أَعْظَمُ النَّاسِ أَجْرًا فِي الصَّلاَةِ أَبْعَدُهُمْ فَأَبْعَدُهُمْ مَمْشًى",
  },
  ibnmajah_1412: {
    shortText: "Walking to Masjid Quba earns a reward like Umrah.",
    fullText:
      "Sahl ibn Hunayf reported: The Prophet (ﷺ) said, \"Whoever purifies himself in his house, then comes to the mosque of Quba and prays in it, will have a reward like that of Umrah.\"",
    source: "Sunan Ibn Majah 1412",
    link: "https://sunnah.com/ibnmajah:1412",
    grade: "Hasan (Good)",
    arabic: "مَنْ تَطَهَّرَ فِي بَيْتِهِ ثُمَّ أَتَى مَسْجِدَ قُبَاءَ فَصَلَّى فِيهِ صَلاَةً كَانَ لَهُ كَأَجْرِ عُمْرَةٍ",
  },
  muslim_654: {
    shortText: "Prayer in congregation is 27 times better than praying alone.",
    fullText:
      "Ibn Umar reported: The Messenger of Allah (ﷺ) said, \"Prayer in congregation is twenty-seven degrees better than prayer offered by a single person.\"",
    source: "Sahih Muslim 654",
    link: "https://sunnah.com/muslim:654",
    grade: "Sahih (Authentic)",
    arabic: "صَلاَةُ الْجَمَاعَةِ أَفْضَلُ مِنْ صَلاَةِ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً",
  },
};

interface HadithTooltipProps {
  hadithKey: string;
  children?: React.ReactNode;
  className?: string;
}

const HadithTooltip = ({ hadithKey, children, className = "" }: HadithTooltipProps) => {
  const hadith = VERIFIED_HADITHS[hadithKey];
  const [open, setOpen] = useState(false);

  if (!hadith) return <span className={className}>{children}</span>;

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <span
          className={`cursor-help border-b border-dashed border-primary/40 ${className}`}
          onClick={() => setOpen(!open)}
        >
          {children || hadith.shortText}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs sm:max-w-sm p-4" side="top">
        <div className="space-y-2">
          {hadith.arabic && (
            <p className="font-arabic text-xs text-right leading-loose text-muted-foreground">
              {hadith.arabic}
            </p>
          )}
          <p className="text-xs text-popover-foreground leading-relaxed italic">
            "{hadith.fullText}"
          </p>
          <div className="flex items-center justify-between text-[10px]">
            <a
              href={hadith.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              {hadith.source}
            </a>
            {hadith.grade && (
              <span className="text-muted-foreground">
                {hadith.grade}
              </span>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default HadithTooltip;
