import ProductCard, { type Product } from './ProductCard'

interface Props {
  products: Product[]
}

export default function FeaturedProducts({ products }: Props) {
  return (
    <div className="max-w-[1600px] mx-auto px-5 md:px-12 pb-10">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
