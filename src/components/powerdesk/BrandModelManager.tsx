import { useState } from 'react';
import { Plus, Edit, Trash2, ChevronRight, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormModal } from '@/components/common/FormModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand, Brand } from '@/hooks/useBrands';
import { useModels, useCreateModel, useUpdateModel, useDeleteModel, useModelsByBrand, Model } from '@/hooks/useModels';

export function BrandModelManager() {
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const { data: allModels = [] } = useModels();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [brandFormData, setBrandFormData] = useState({ name: '', logo_url: '', is_active: true, is_luxury: false });
  const [modelFormData, setModelFormData] = useState({ name: '', brand_id: '', is_active: true });

  const handleBrandSubmit = () => {
    if (editingBrand) {
      updateBrand.mutate({ id: editingBrand.id, ...brandFormData });
    } else {
      createBrand.mutate(brandFormData);
    }
    setIsBrandModalOpen(false);
    setEditingBrand(null);
    setBrandFormData({ name: '', logo_url: '', is_active: true, is_luxury: false });
  };

  const handleModelSubmit = () => {
    if (editingModel) {
      updateModel.mutate({ id: editingModel.id, ...modelFormData });
    } else {
      createModel.mutate(modelFormData);
    }
    setIsModelModalOpen(false);
    setEditingModel(null);
    setModelFormData({ name: '', brand_id: '', is_active: true });
  };

  const getModelsForBrand = (brandId: string) => {
    return allModels.filter(m => m.brand_id === brandId);
  };

  if (brandsLoading) return <Skeleton className="h-96" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Brands & Models</CardTitle>
            <CardDescription>Manage vehicle brands and their models</CardDescription>
          </div>
          <Button onClick={() => setIsBrandModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {brands.map((brand) => {
          const models = getModelsForBrand(brand.id);
          return (
            <Collapsible key={brand.id} className="border rounded-lg">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4 transition-transform" />
                    </Button>
                  </CollapsibleTrigger>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{brand.name}</span>
                      <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                        {brand.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {brand.is_luxury && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">
                          <Diamond className="w-3 h-3 mr-1 fill-amber-500" />
                          Luxury
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{models.length} models</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedBrandId(brand.id);
                    setModelFormData({ name: '', brand_id: brand.id, is_active: true });
                    setIsModelModalOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Model
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingBrand(brand);
                    setBrandFormData({
                      name: brand.name,
                      logo_url: brand.logo_url || '',
                      is_active: brand.is_active,
                      is_luxury: brand.is_luxury || false
                    });
                    setIsBrandModalOpen(true);
                  }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteBrand.mutate(brand.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <CollapsibleContent>
                <div className="px-4 pb-4 ml-8 space-y-2">
                  {models.map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{model.name}</span>
                        <Badge variant={model.is_active ? 'outline' : 'secondary'}>
                          {model.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingModel(model);
                          setModelFormData({ name: model.name, brand_id: model.brand_id || '', is_active: model.is_active });
                          setIsModelModalOpen(true);
                        }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteModel.mutate(model.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>

      <FormModal
        open={isBrandModalOpen}
        onOpenChange={setIsBrandModalOpen}
        title={editingBrand ? 'Edit Brand' : 'Add New Brand'}
        onSubmit={handleBrandSubmit}
        isLoading={createBrand.isPending || updateBrand.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Brand Name</Label>
            <Input id="brand-name" value={brandFormData.name} onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo-url">Logo URL (Optional)</Label>
            <Input id="logo-url" value={brandFormData.logo_url} onChange={(e) => setBrandFormData({ ...brandFormData, logo_url: e.target.value })} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="brand-luxury" checked={brandFormData.is_luxury} onCheckedChange={(checked) => setBrandFormData({ ...brandFormData, is_luxury: checked })} />
            <Label htmlFor="brand-luxury" className="flex items-center gap-1.5">
              <Diamond className="w-3.5 h-3.5" />
              Luxury Brand
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="brand-active" checked={brandFormData.is_active} onCheckedChange={(checked) => setBrandFormData({ ...brandFormData, is_active: checked })} />
            <Label htmlFor="brand-active">Active</Label>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={isModelModalOpen}
        onOpenChange={setIsModelModalOpen}
        title={editingModel ? 'Edit Model' : 'Add New Model'}
        onSubmit={handleModelSubmit}
        isLoading={createModel.isPending || updateModel.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Select value={modelFormData.brand_id} onValueChange={(value) => setModelFormData({ ...modelFormData, brand_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model-name">Model Name</Label>
            <Input id="model-name" value={modelFormData.name} onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="model-active" checked={modelFormData.is_active} onCheckedChange={(checked) => setModelFormData({ ...modelFormData, is_active: checked })} />
            <Label htmlFor="model-active">Active</Label>
          </div>
        </div>
      </FormModal>
    </Card >
  );
}
