
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { useActiveBanners } from "@/hooks/useBanners";
import { Skeleton } from "@/components/ui/skeleton";
import Autoplay from "embla-carousel-autoplay"; // Assuming this is installed as it is standard with shadcn/ui carousel, otherwise I might need to check packages

export const BannerCarousel = () => {
    const { data: banners, isLoading } = useActiveBanners();

    if (isLoading) {
        return (
            <div className="w-full mb-8">
                <Skeleton className="w-full h-48 md:h-64 rounded-xl" />
            </div>
        );
    }

    if (!banners || banners.length === 0) {
        return null;
    }

    return (
        <div className="w-full mb-8">
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 4000,
                    }),
                ]}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {banners.map((banner) => (
                        <CarouselItem key={banner.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                            <a href={banner.link_url || '#'} className="block h-full">
                                <div className="relative overflow-hidden rounded-xl aspect-[16/8] md:aspect-[16/7] group">
                                    <img
                                        src={banner.image_url}
                                        alt={banner.title}
                                        loading={banners.indexOf(banner) === 0 ? "eager" : "lazy"}
                                        decoding="async"
                                        fetchPriority={banners.indexOf(banner) === 0 ? "high" : "auto"}
                                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {/* Optional: Overlay title if needed, but banners usually have text embedded */}
                                    {/* <div className="absolute inset-0 bg-black/20" /> */}
                                </div>
                            </a>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {/* Only show navigation arrows on desktop if multiple banners */}
                {banners.length > 1 && (
                    <div className="hidden md:block">
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                    </div>
                )}
            </Carousel>
        </div>
    );
};
