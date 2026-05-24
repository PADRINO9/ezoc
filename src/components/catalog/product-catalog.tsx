import { CheckCircle2, CircleOff, Plus } from "lucide-react";
import { addProductAction, setProductActiveAction } from "@/lib/actions";
import type { Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from "@/components/ui/table";

export function ProductCatalog({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>קטלוג מוצרים לזיהוי הזמנות</CardTitle>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            ה-parser משתמש בשמות, כינויים ואפשרויות חיתוך כדי להפוך הודעות חופשיות להזמנות מובנות.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrap>
            <Table>
              <THead>
                <Tr>
                  <Th>מוצר</Th>
                  <Th>כינויים</Th>
                  <Th>אפשרויות חיתוך</Th>
                  <Th>סטטוס</Th>
                  <Th>פעולה</Th>
                </Tr>
              </THead>
              <TBody>
                {products.map((product) => (
                  <Tr key={product.id}>
                    <Td className="text-lg font-black text-slate-950">{product.name}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {product.aliases.map((alias) => (
                          <Badge key={alias}>{alias}</Badge>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {product.cut_options.map((option) => (
                          <Badge key={option} tone="teal">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={product.active ? "green" : "neutral"} className="gap-1.5">
                        {product.active ? (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <CircleOff className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {product.active ? "פעיל" : "כבוי"}
                      </Badge>
                    </Td>
                    <Td>
                      <form action={setProductActiveAction}>
                        <input type="hidden" name="product_id" value={product.id} />
                        <input type="hidden" name="active" value={product.active ? "false" : "true"} />
                        <Button type="submit" variant="outline" size="sm">
                          {product.active ? "כבה" : "הפעל"}
                        </Button>
                      </form>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-teal-900" aria-hidden="true" />
            מוצר חדש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addProductAction} className="space-y-4">
            <Field>
              <Label htmlFor="name">שם מוצר</Label>
              <Input id="name" name="name" placeholder="לדוגמה: פלמידה" />
            </Field>
            <Field>
              <Label htmlFor="aliases">כינויים</Label>
              <Input id="aliases" name="aliases" placeholder="מופרדים בפסיקים" />
            </Field>
            <Field>
              <Label htmlFor="cut_options">אפשרויות חיתוך</Label>
              <Input id="cut_options" name="cut_options" placeholder="נקי, פילה, פרוסות" />
            </Field>
            <Button type="submit" className="w-full">
              הוסף לקטלוג
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
