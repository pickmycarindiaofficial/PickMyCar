import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CityManager } from './CityManager';
import { CategoryManager } from './CategoryManager';
import { BrandModelManager } from './BrandModelManager';
import { FeatureManager } from './FeatureManager';
import { TypeManager } from './TypeManager';
import { StatusManager } from './StatusManager';
import { BannerManager } from './BannerManager';
import { StaffManager } from './StaffManager';
import { GalleryManager } from './GalleryManager';
import { PermissionGate } from '@/components/common/PermissionGate';

export function MasterSetup() {
  const [activeTab, setActiveTab] = useState('staff');

  return (
    <PermissionGate roles={['powerdesk', 'website_manager']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Setup</h1>
          <p className="text-muted-foreground">
            Manage all master data for the platform
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="space-y-4">
            <StaffManager />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <GalleryManager />
          </TabsContent>

          <TabsContent value="cities" className="space-y-4">
            <CityManager />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="brands" className="space-y-4">
            <BrandModelManager />
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <FeatureManager />
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <TypeManager />
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <StatusManager />
          </TabsContent>

          <TabsContent value="banners" className="space-y-4">
            <BannerManager />
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGate>
  );
}

