
// Using Kroki.io for rendering.
// We use the POST API instead of GET + Base64/Deflate to avoid complex client-side compression
// and to ensure full support for UTF-8 characters (like Chinese) without encoding artifacts.

export const renderDiagram = async (code: string, format: 'svg' | 'png' | 'pdf' = 'svg'): Promise<string> => {
  if (!code.trim()) return '';
  
  try {
    const response = await fetch(`https://kroki.io/plantuml/${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: code
    });

    if (!response.ok) {
      console.warn(`Kroki render failed: ${response.status} ${response.statusText}`);
      return '';
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to render diagram:", error);
    return '';
  }
};

export const INITIAL_CODE = `@startuml
actor MainMethod as M
participant "JVM" as JVM
participant "Local Var Table" as LVT
participant "Operand Stack" as STACK
participant "PrintStream(System.out)" as OUT

M -> JVM : 方法执行开始

== 初始化变量 ==
JVM -> STACK : iconst_1 (push 1)
JVM -> LVT : istore_1 (store 1)

JVM -> STACK : iconst_2 (push 2)
JVM -> LVT : istore_2 (store 2)

== 计算 (a+b)*3 ==
JVM -> STACK : iload_1 (push LVT[1]=1)
JVM -> STACK : iload_2 (push LVT[2]=2)
JVM -> STACK : iadd (1+2=3)

JVM -> STACK : iconst_3 (push 3)
JVM -> STACK : imul (3 * 3 = 9)
JVM -> LVT : istore_3 (store 9)

== 调用 println ==
JVM -> OUT : getstatic System.out
JVM -> STACK : iload_3 (push 9)
JVM -> OUT : println(9)

OUT --> JVM : 输出 "9"

== 方法结束 ==
JVM -> M : return
@enduml`;