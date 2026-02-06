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
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-transparent p-0 mb-6 gap-2 h-auto no-scrollbar">
            <TabsTrigger className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2" value="staff">Staff</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2" value="cities">Cities</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2" value="categories">Categories</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2" value="brands">Brands</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2" value="features">Features</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2" value="types">Types</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2" value="status">Status</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2" value="banners">Banners</TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="space-y-4">
            <StaffManager />
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

